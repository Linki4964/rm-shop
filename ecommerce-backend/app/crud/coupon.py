from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.coupon import Coupon, UserCoupon


class CRUDCoupon(CRUDBase[Coupon]):
    async def get_by_code(self, db: AsyncSession, *, code: str) -> Optional[Coupon]:
        result = await db.execute(select(Coupon).where(Coupon.code == code))
        return result.scalar_one_or_none()

    async def validate(self, db: AsyncSession, *, code: str, order_amount: float) -> dict:
        coupon = await self.get_by_code(db, code=code)
        if not coupon:
            return self._fail(code, "优惠券不存在")
        return self._validate_coupon(coupon, order_amount)

    async def validate_user_coupon(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        code: str,
        order_amount: float,
    ) -> tuple[Optional[UserCoupon], dict]:
        stmt = (
            select(UserCoupon)
            .options(selectinload(UserCoupon.coupon))
            .join(Coupon, Coupon.id == UserCoupon.coupon_id)
            .where(
                UserCoupon.user_id == user_id,
                UserCoupon.status == "claimed",
                Coupon.code == code,
            )
            .order_by(UserCoupon.claimed_at.asc())
        )
        user_coupon = (await db.execute(stmt)).scalars().first()
        if not user_coupon:
            return None, self._fail(code, "该优惠券未领取或已使用")
        result = self._validate_coupon(user_coupon.coupon, order_amount)
        return user_coupon, result

    async def get_available(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        order_amount: float,
        claimed_only: bool = False,
    ) -> list[dict]:
        coupon_stmt = select(Coupon).where(Coupon.is_active == True)
        coupons = list((await db.execute(coupon_stmt)).scalars().all())

        user_coupon_stmt = select(UserCoupon).where(UserCoupon.user_id == user_id)
        user_coupon_rows = list((await db.execute(user_coupon_stmt)).scalars().all())
        claimed_coupon_ids = {row.coupon_id for row in user_coupon_rows}

        items: list[dict] = []
        for coupon in coupons:
            if claimed_only and coupon.id not in claimed_coupon_ids:
                continue
            item = self._build_available_item(coupon, order_amount)
            item["is_claimed"] = coupon.id in claimed_coupon_ids
            items.append(item)
        return items

    async def claim_coupon(self, db: AsyncSession, *, user_id: int, coupon_id: int) -> UserCoupon:
        coupon = await self.get(db, id=coupon_id)
        if not coupon:
            raise ValueError("优惠券不存在")
        if not coupon.is_active:
            raise ValueError("优惠券已失效")
        if coupon.expires_at and coupon.expires_at < datetime.now():
            raise ValueError("优惠券已过期")
        if coupon.usage_limit > 0 and coupon.used_count >= coupon.usage_limit:
            raise ValueError("优惠券已领完")

        existing_stmt = select(UserCoupon).where(
            UserCoupon.user_id == user_id,
            UserCoupon.coupon_id == coupon_id,
        )
        existing = (await db.execute(existing_stmt)).scalar_one_or_none()
        if existing:
            raise ValueError("同一种优惠券每人限领一张")

        user_coupon = UserCoupon(user_id=user_id, coupon_id=coupon_id, status="claimed")
        db.add(user_coupon)
        await db.commit()
        result = await db.execute(
            select(UserCoupon)
            .options(selectinload(UserCoupon.coupon))
            .where(UserCoupon.id == user_coupon.id)
        )
        return result.scalar_one()

    async def get_user_coupons(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        status: Optional[str] = None,
    ) -> list[UserCoupon]:
        stmt = (
            select(UserCoupon)
            .options(selectinload(UserCoupon.coupon))
            .where(UserCoupon.user_id == user_id)
            .order_by(UserCoupon.claimed_at.desc())
        )
        if status:
            stmt = stmt.where(UserCoupon.status == status)
        return list((await db.execute(stmt)).scalars().all())

    async def consume_user_coupon(
        self,
        db: AsyncSession,
        *,
        user_coupon: UserCoupon,
    ) -> None:
        user_coupon.status = "used"
        user_coupon.used_at = datetime.now()
        user_coupon.coupon.used_count += 1
        await db.flush()

    def _validate_coupon(self, coupon: Coupon, order_amount: float) -> dict:
        if not coupon.is_active:
            return self._fail(coupon.code, "优惠券已失效")
        if coupon.expires_at and coupon.expires_at < datetime.now():
            return self._fail(coupon.code, "优惠券已过期")
        if coupon.usage_limit > 0 and coupon.used_count >= coupon.usage_limit:
            return self._fail(coupon.code, "优惠券已领完")
        if order_amount < float(coupon.min_order_amount):
            return self._fail(coupon.code, f"订单金额需满 {float(coupon.min_order_amount):.2f} 元才可使用")

        if coupon.discount_type == "percentage":
            discount_amount = round(order_amount * float(coupon.discount_value) / 100, 2)
        else:
            discount_amount = min(float(coupon.discount_value), order_amount)
        final_amount = max(round(order_amount - discount_amount, 2), 0)
        return {
            "valid": True,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": float(coupon.discount_value),
            "discount_amount": discount_amount,
            "final_amount": final_amount,
            "message": "优惠券可用",
        }

    def _build_available_item(self, coupon: Coupon, order_amount: float) -> dict:
        result = self._validate_coupon(coupon, order_amount)
        if not result["valid"]:
            return {
                "coupon_id": coupon.id,
                "code": coupon.code,
                "discount_type": coupon.discount_type,
                "discount_value": float(coupon.discount_value),
                "min_order_amount": float(coupon.min_order_amount),
                "discount_amount": 0,
                "final_amount": order_amount,
                "applicable": False,
                "reason": result["message"],
                "expires_at": coupon.expires_at.strftime("%Y-%m-%d") if coupon.expires_at else None,
            }
        return {
            "coupon_id": coupon.id,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": float(coupon.discount_value),
            "min_order_amount": float(coupon.min_order_amount),
            "discount_amount": result["discount_amount"],
            "final_amount": result["final_amount"],
            "applicable": True,
            "reason": "",
            "expires_at": coupon.expires_at.strftime("%Y-%m-%d") if coupon.expires_at else None,
        }

    def _fail(self, code: str, message: str) -> dict:
        return {
            "valid": False,
            "code": code,
            "discount_type": "",
            "discount_value": 0,
            "discount_amount": 0,
            "final_amount": 0,
            "message": message,
        }


coupon_crud = CRUDCoupon(Coupon)
