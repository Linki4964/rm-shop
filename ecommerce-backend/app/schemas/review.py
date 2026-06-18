# app/schemas/review.py
from pydantic import BaseModel, Field
from datetime import datetime


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=500)


class ReviewUserOut(BaseModel):
    id: int
    username: str
    full_name: str | None = None

    class Config:
        from_attributes = True


class ReviewOut(BaseModel):
    id: int
    rating: int
    comment: str | None = None
    created_at: datetime
    user: ReviewUserOut | None = None

    class Config:
        from_attributes = True


class ReviewStats(BaseModel):
    average: float = 0
    count: int = 0
    distribution: dict[str, int] = {}  # {"5": 3, "4": 1, ...}
