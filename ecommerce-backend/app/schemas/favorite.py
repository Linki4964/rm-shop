# app/schemas/favorite.py
from pydantic import BaseModel
from datetime import datetime
from app.schemas.product import ProductOut


class FavoriteOut(BaseModel):
    id: int
    product_id: int
    created_at: datetime
    product: ProductOut | None = None

    class Config:
        from_attributes = True
