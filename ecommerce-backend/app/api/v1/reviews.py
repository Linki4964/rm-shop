# app/api/v1/reviews.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.review import review_crud
from app.schemas.review import ReviewCreate, ReviewOut, ReviewStats
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(tags=["reviews"])


@router.get("/product/{product_id}", response_model=list[ReviewOut])
async def list_reviews(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取商品的所有评论（公开）"""
    return await review_crud.get_product_reviews(db, product_id=product_id)


@router.get("/product/{product_id}/stats", response_model=ReviewStats)
async def review_stats(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取商品评分统计"""
    return await review_crud.get_product_stats(db, product_id=product_id)


@router.post("/product/{product_id}", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    product_id: int,
    review_in: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """提交商品评价"""
    data = review_in.model_dump()
    data["user_id"] = current_user.id
    data["product_id"] = product_id
    return await review_crud.create(db, obj_in=data)
