# app/api/v1/admin_stats.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, or_
from datetime import date, timedelta
from app.core.database import get_db
from app.api.deps import get_current_superuser
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product

router = APIRouter(tags=["admin-stats"])


@router.get("/stats/orders/trend")
async def order_trend(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=6)
    # 查询最近7天已支付订单的每日总金额
    result = await db.execute(
        select(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("amount"),
        )
        .where(
            or_(
                Order.status == OrderStatus.PAID.value,
                Order.status == OrderStatus.COMPLETED.value,
            )
        )
        .where(func.date(Order.created_at) >= start_date)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    rows = result.all()
    dates = [row.date.strftime("%Y-%m-%d") for row in rows]
    amounts = [float(row.amount) for row in rows]
    return {"dates": dates, "amounts": amounts}


@router.get("/stats/products/top-selling")
async def top_selling_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    result = await db.execute(
        select(Product.name, func.sum(OrderItem.quantity).label("total_sold"))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    )
    rows = result.all()
    products = [row.name for row in rows]
    quantities = [row.total_sold for row in rows]
    return {"products": products, "quantities": quantities}