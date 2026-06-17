# app/api/v1/favorites.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.favorite import favorite_crud
from app.schemas.favorite import FavoriteOut
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(tags=["favorites"])


@router.post("/toggle/{product_id}")
async def toggle_favorite(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """切换收藏状态"""
    return await favorite_crud.toggle(
        db, user_id=current_user.id, product_id=product_id
    )


@router.get("/check")
async def check_favorites(
    ids: str = Query("", description="逗号分隔的商品ID列表"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """批量查询收藏状态，返回 { product_id: true/false }"""
    if not ids.strip():
        return {}
    product_ids = [int(x) for x in ids.split(",") if x.strip().isdigit()]
    if not product_ids:
        return {}
    favorited = await favorite_crud.get_favorited_product_ids(
        db, user_id=current_user.id, product_ids=product_ids
    )
    return {str(pid): pid in favorited for pid in product_ids}


@router.get("/", response_model=list[FavoriteOut])
async def list_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """获取我的收藏列表"""
    return await favorite_crud.get_user_favorites(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
