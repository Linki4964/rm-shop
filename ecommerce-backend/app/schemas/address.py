# app/schemas/address.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AddressCreate(BaseModel):
    province: str = Field(..., min_length=1, max_length=50, description="省")
    city: str = Field(..., min_length=1, max_length=50, description="市")
    detail: str = Field(..., min_length=1, max_length=500, description="详细地址")
    recipient_name: Optional[str] = Field(None, max_length=50)
    recipient_phone: Optional[str] = Field(None, max_length=20)
    is_default: bool = False


class AddressUpdate(BaseModel):
    province: Optional[str] = Field(None, min_length=1, max_length=50)
    city: Optional[str] = Field(None, min_length=1, max_length=50)
    detail: Optional[str] = Field(None, min_length=1, max_length=500)
    recipient_name: Optional[str] = Field(None, max_length=50)
    recipient_phone: Optional[str] = Field(None, max_length=20)
    is_default: Optional[bool] = None


class AddressOut(BaseModel):
    id: int
    province: str
    city: str
    detail: str
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True
