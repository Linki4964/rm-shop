from datetime import datetime
from decimal import Decimal
from typing import Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.crud.cart import cart as cart_crud
from app.crud.coupon import coupon_crud
from app.crud.product import product as product_crud
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderCreate


class CRUDOrder(CRUDBase[Order]):
    async def create_order_from_cart(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        obj_in: OrderCreate,
    ) -> Order:
        cart_items = await cart_crud.get_user_cart(db, user_id=user_id)
        if not cart_items:
            raise ValueError("购物车为空，无法创建订单")

        order_items_data = []
        total_amount = Decimal("0.0")
        for item in cart_items:
            product = item.product
            if not product or not product.is_active:
                raise ValueError(f"商品 {product.name if product else '未知'} 已下架或不存在")
            if product.stock < item.quantity:
                raise ValueError(f"商品 {product.name} 库存不足，当前库存 {product.stock}")
            item_total = product.price * item.quantity
            total_amount += item_total
            order_items_data.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "quantity": item.quantity,
                    "price": product.price,
                }
            )

        discount_amount = Decimal("0.0")
        coupon_code: str | None = None
        user_coupon = None
        if obj_in.coupon_code:
            code = obj_in.coupon_code.strip().upper()
            user_coupon, result = await coupon_crud.validate_user_coupon(
                db,
                user_id=user_id,
                code=code,
                order_amount=float(total_amount),
            )
            if not result["valid"] or not user_coupon:
                raise ValueError(result["message"])
            discount_amount = Decimal(str(result["discount_amount"]))
            coupon_code = code

        order_number = f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}{user_id:04d}"
        order = Order(
            user_id=user_id,
            order_number=order_number,
            total_amount=total_amount,
            discount_amount=discount_amount,
            coupon_code=coupon_code,
            status=OrderStatus.PENDING,
            shipping_address=obj_in.shipping_address,
            after_sale_status="none",
        )
        db.add(order)
        await db.flush()

        for item_data in order_items_data:
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=item_data["product_id"],
                    product_name=item_data["product_name"],
                    quantity=item_data["quantity"],
                    price=item_data["price"],
                )
            )

        for item in cart_items:
            await product_crud.reduce_stock(db, product_id=item.product_id, quantity=item.quantity)

        if user_coupon:
            await coupon_crud.consume_user_coupon(db, user_coupon=user_coupon)

        await cart_crud.clear_cart(db, user_id=user_id)
        await db.commit()
        return await self.get_with_items(db, id=order.id)

    async def get_with_items(self, db: AsyncSession, *, id: int) -> Optional[Order]:
        result = await db.execute(
            select(Order)
            .where(Order.id == id)
            .options(
                selectinload(Order.user),
                selectinload(Order.items).selectinload(OrderItem.product),
            )
        )
        return result.scalar_one_or_none()

    async def get_user_orders(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[list[Order], int]:
        total = (await db.execute(select(func.count()).where(Order.user_id == user_id))).scalar() or 0
        query = (
            select(Order)
            .where(Order.user_id == user_id)
            .options(selectinload(Order.items).selectinload(OrderItem.product))
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        orders = list((await db.execute(query)).scalars().all())
        return orders, total

    async def cancel_order(self, db: AsyncSession, *, order: Order, reason: str) -> Order:
        if order.status not in (OrderStatus.PENDING, OrderStatus.PAID):
            raise ValueError("只能取消待处理或已支付订单")
        for item in order.items:
            if item.product_id:
                await product_crud.increase_stock(db, product_id=item.product_id, quantity=item.quantity)
        order.status = OrderStatus.CANCELLED
        order.cancel_reason = reason
        await db.commit()
        return await self.get_with_items(db, id=order.id)

    async def update_status(self, db: AsyncSession, *, order: Order, new_status: OrderStatus) -> Order:
        order.status = new_status
        await db.commit()
        return await self.get_with_items(db, id=order.id)

    async def request_after_sale(self, db: AsyncSession, *, order: Order, reason: str) -> Order:
        if order.status not in (OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED):
            raise ValueError("当前订单状态不支持申请售后")
        order.after_sale_status = "requested"
        order.after_sale_reason = reason
        await db.commit()
        return await self.get_with_items(db, id=order.id)

    async def review_after_sale(
        self,
        db: AsyncSession,
        *,
        order: Order,
        review_status: str,
    ) -> Order:
        if order.after_sale_status != "requested":
            raise ValueError("当前订单没有待审批的售后申请")
        if review_status not in {"approved", "rejected"}:
            raise ValueError("售后审核状态不合法")

        order.after_sale_status = review_status
        await db.commit()
        return await self.get_with_items(db, id=order.id)

    async def get_all_orders(
        self,
        db: AsyncSession,
        *,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[list[Order], int]:
        query = select(Order).options(
            selectinload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        count_query = select(func.count()).select_from(Order)
        if status:
            query = query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)
        total = (await db.execute(count_query)).scalar() or 0
        orders = list((await db.execute(query.order_by(Order.created_at.desc()).offset(skip).limit(limit))).scalars().all())
        return orders, total


order_crud = CRUDOrder(Order)
