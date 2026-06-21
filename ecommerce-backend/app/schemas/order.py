from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.product import ProductOut


class UserBrief(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True


class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    quantity: int
    price: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    order_number: str
    total_amount: float
    discount_amount: float = 0
    coupon_code: Optional[str] = None
    status: str
    shipping_address: str
    cancel_reason: Optional[str] = None
    after_sale_status: Optional[str] = None
    after_sale_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut] = []
    user: Optional[UserBrief] = None

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    items: list[OrderOut]
    total: int


class OrderCreate(BaseModel):
    shipping_address: str = Field(..., min_length=5, max_length=500)
    coupon_code: Optional[str] = Field(None, max_length=50)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="pending/paid/shipped/completed/cancelled")


class OrderCancelRequest(BaseModel):
    reason: str = Field(..., min_length=2, max_length=255)


class AfterSaleRequest(BaseModel):
    reason: str = Field(..., min_length=2, max_length=255)


class AfterSaleReviewRequest(BaseModel):
    status: str = Field(..., description="approved/rejected")
