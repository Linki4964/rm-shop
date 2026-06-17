# app/schemas/coupon.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CouponCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    discount_type: str = Field(default="fixed", pattern="^(percentage|fixed)$")
    discount_value: float = Field(..., gt=0)
    min_order_amount: float = Field(default=0, ge=0)
    is_active: bool = True
    usage_limit: int = Field(default=0, ge=0)
    expires_at: Optional[datetime] = None


class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed)$")
    discount_value: Optional[float] = Field(None, gt=0)
    min_order_amount: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None
    usage_limit: Optional[int] = Field(None, ge=0)
    expires_at: Optional[datetime] = None


class CouponOut(BaseModel):
    id: int
    code: str
    discount_type: str
    discount_value: float
    min_order_amount: float
    is_active: bool
    usage_limit: int
    used_count: int
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=1)
    order_amount: float = Field(..., ge=0)


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_type: str
    discount_value: float
    discount_amount: float = 0
    final_amount: float = 0
    message: str = ""


class CouponAvailableItem(BaseModel):
    """可用优惠券列表项（含预计算的折扣）"""
    code: str
    discount_type: str
    discount_value: float
    min_order_amount: float
    discount_amount: float
    final_amount: float
    applicable: bool          # 是否满足最低消费
    reason: str = ""          # 不满足时的原因
    expires_at: str | None = None
