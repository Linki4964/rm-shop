# app/models/coupon.py
from datetime import datetime
from sqlalchemy import String, Integer, DECIMAL, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False, default="fixed", comment="percentage | fixed")
    discount_value: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False, comment="折扣值：百分比为如10（10%），固定为金额")
    min_order_amount: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False, default=0, comment="最低订单金额")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    usage_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="使用上限，0=不限制")
    used_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
