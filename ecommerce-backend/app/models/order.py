# app/models/order.py
import enum
from sqlalchemy import (
    String, Integer, DECIMAL, DateTime, ForeignKey, Enum, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class OrderStatus(str, enum.Enum):
    PENDING = "pending"          # 待处理
    PAID = "paid"                # 已支付（模拟）
    SHIPPED = "shipped"          # 已发货
    COMPLETED = "completed"      # 已完成
    CANCELLED = "cancelled"      # 已取消


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    total_amount: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False, default=0, comment="优惠券抵扣金额")
    coupon_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    shipping_address: Mapped[str] = mapped_column(String(500), nullable=False)
    cancel_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    after_sale_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    after_sale_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关联关系
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False, comment="下单时的价格快照")
    product_name: Mapped[str] = mapped_column(String(200), nullable=True, comment="商品名称快照（防止商品被删除后无法显示）")

    # 关联关系
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product")   
