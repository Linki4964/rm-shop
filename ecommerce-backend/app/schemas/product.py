from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Product name")
    description: Optional[str] = Field(None, max_length=2000, description="Product description")
    price: float = Field(..., gt=0, description="Product price")
    stock: int = Field(0, ge=0, description="Stock quantity")
    image_url: Optional[str] = Field(None, max_length=500, description="Product image URL")
    category: Optional[str] = Field(None, max_length=100, description="Product category")
    is_active: bool = Field(True, description="Whether the product is active")
    features: Optional[list[dict]] = Field(None, description="Product feature cards")

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if round(v, 2) != v:
            raise ValueError("Price can have at most 2 decimal places")
        return v

    @field_validator("stock")
    @classmethod
    def validate_stock(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Stock cannot be negative")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    features: Optional[list[dict]] = Field(None, description="Product feature cards")

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and round(v, 2) != v:
            raise ValueError("Price can have at most 2 decimal places")
        return v

    @field_validator("stock")
    @classmethod
    def validate_stock(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Stock cannot be negative")
        return v


class ProductOut(ProductBase):
    id: int
    avg_rating: float = 0
    review_count: int = 0
    sales_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    size: int
    pages: int


class ProductSearchParams(BaseModel):
    keyword: Optional[str] = Field(None, description="Keyword search")
    category: Optional[str] = Field(None, description="Product category")
    min_price: Optional[float] = Field(None, ge=0, description="Minimum price")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price")
    in_stock: Optional[bool] = Field(None, description="Only show in-stock products")
    is_active: Optional[bool] = Field(None, description="Whether the product is active")
    sort_by: Optional[str] = Field("created_at", description="price/stock/created_at/sales_count/avg_rating")
    sort_order: Optional[str] = Field("desc", description="asc/desc")
