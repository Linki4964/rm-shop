from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


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
    coupon_id: int
    code: str
    discount_type: str
    discount_value: float
    min_order_amount: float
    discount_amount: float
    final_amount: float
    applicable: bool
    reason: str = ""
    expires_at: str | None = None
    is_claimed: bool = False


class UserCouponOut(BaseModel):
    id: int
    status: str
    claimed_at: datetime
    used_at: Optional[datetime] = None
    coupon: CouponOut

    class Config:
        from_attributes = True
