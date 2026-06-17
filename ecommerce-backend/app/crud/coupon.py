# app/crud/coupon.py
from decimal import Decimal
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.coupon import Coupon


class CRUDCoupon(CRUDBase[Coupon]):
    async def get_by_code(self, db: AsyncSession, *, code: str) -> Optional[Coupon]:
        result = await db.execute(select(Coupon).where(Coupon.code == code))
        return result.scalar_one_or_none()

    async def validate(
        self, db: AsyncSession, *, code: str, order_amount: float
    ) -> dict:
        """
        校验优惠券并返回折扣信息。
        返回格式: { valid, code, discount_type, discount_value, discount_amount, final_amount, message }
        """
        coupon = await self.get_by_code(db, code=code)

        if not coupon:
            return self._fail(code, "优惠券不存在")
        if not coupon.is_active:
            return self._fail(code, "优惠券已失效")
        if coupon.expires_at and coupon.expires_at < datetime.now():
            return self._fail(code, "优惠券已过期")
        if coupon.usage_limit > 0 and coupon.used_count >= coupon.usage_limit:
            return self._fail(code, "优惠券已被领完")
        if order_amount < float(coupon.min_order_amount):
            return self._fail(code, f"订单金额需满 ¥{coupon.min_order_amount:.2f} 才可使用")

        # 计算折扣
        if coupon.discount_type == "percentage":
            discount_amount = round(order_amount * float(coupon.discount_value) / 100, 2)
        else:
            discount_amount = min(float(coupon.discount_value), order_amount)

        final_amount = round(order_amount - discount_amount, 2)
        if final_amount < 0:
            final_amount = 0

        return {
            "valid": True,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": float(coupon.discount_value),
            "discount_amount": discount_amount,
            "final_amount": final_amount,
            "message": "优惠券可用"
        }

    async def get_available(
        self, db: AsyncSession, *, order_amount: float
    ) -> list[dict]:
        """获取所有可用优惠券，附带针对当前订单的折扣计算"""
        result = await db.execute(
            select(Coupon).where(Coupon.is_active == True)
        )
        coupons = result.scalars().all()

        items = []
        for c in coupons:
            item = self._build_available_item(c, order_amount)
            items.append(item)
        return items

    def _build_available_item(self, coupon: Coupon, order_amount: float) -> dict:
        expires_at_str = coupon.expires_at.strftime("%Y-%m-%d") if coupon.expires_at else None

        # 检查是否过期
        if coupon.expires_at and coupon.expires_at < datetime.now():
            return {
                "code": coupon.code, "discount_type": coupon.discount_type,
                "discount_value": float(coupon.discount_value),
                "min_order_amount": float(coupon.min_order_amount),
                "discount_amount": 0, "final_amount": order_amount,
                "applicable": False, "reason": "已过期",
                "expires_at": expires_at_str,
            }

        # 检查使用次数
        if coupon.usage_limit > 0 and coupon.used_count >= coupon.usage_limit:
            return {
                "code": coupon.code, "discount_type": coupon.discount_type,
                "discount_value": float(coupon.discount_value),
                "min_order_amount": float(coupon.min_order_amount),
                "discount_amount": 0, "final_amount": order_amount,
                "applicable": False, "reason": "已被领完",
                "expires_at": expires_at_str,
            }

        # 检查最低消费
        if order_amount < float(coupon.min_order_amount):
            return {
                "code": coupon.code, "discount_type": coupon.discount_type,
                "discount_value": float(coupon.discount_value),
                "min_order_amount": float(coupon.min_order_amount),
                "discount_amount": 0, "final_amount": order_amount,
                "applicable": False,
                "reason": f"满 ¥{coupon.min_order_amount:.0f} 可用",
                "expires_at": expires_at_str,
            }

        # 计算折扣
        if coupon.discount_type == "percentage":
            discount_amount = round(order_amount * float(coupon.discount_value) / 100, 2)
        else:
            discount_amount = min(float(coupon.discount_value), order_amount)
        final_amount = round(order_amount - discount_amount, 2)

        return {
            "code": coupon.code, "discount_type": coupon.discount_type,
            "discount_value": float(coupon.discount_value),
            "min_order_amount": float(coupon.min_order_amount),
            "discount_amount": discount_amount, "final_amount": final_amount,
            "applicable": True, "reason": "",
            "expires_at": expires_at_str,
        }

    async def increment_usage(self, db: AsyncSession, *, code: str) -> None:
        coupon = await self.get_by_code(db, code=code)
        if coupon:
            coupon.used_count += 1
            await db.commit()

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
