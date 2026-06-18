# app/crud/favorite.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.crud.base import CRUDBase
from app.models.favorite import Favorite
from app.models.product import Product


class CRUDFavorite(CRUDBase[Favorite]):
    async def toggle(self, db: AsyncSession, *, user_id: int, product_id: int) -> dict:
        """切换收藏状态，返回 { favorited: bool }"""
        result = await db.execute(
            select(Favorite).where(
                Favorite.user_id == user_id,
                Favorite.product_id == product_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            await db.delete(existing)
            await db.commit()
            return {"favorited": False}
        fav = Favorite(user_id=user_id, product_id=product_id)
        db.add(fav)
        await db.commit()
        return {"favorited": True}

    async def is_favorited(self, db: AsyncSession, *, user_id: int, product_id: int) -> bool:
        result = await db.execute(
            select(Favorite).where(
                Favorite.user_id == user_id,
                Favorite.product_id == product_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_user_favorites(
        self, db: AsyncSession, *, user_id: int, skip: int = 0, limit: int = 50
    ) -> list[Favorite]:
        result = await db.execute(
            select(Favorite)
            .where(Favorite.user_id == user_id)
            .options(selectinload(Favorite.product))
            .order_by(Favorite.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_favorited_product_ids(
        self, db: AsyncSession, *, user_id: int, product_ids: list[int]
    ) -> set[int]:
        """批量查询哪些商品已被收藏"""
        result = await db.execute(
            select(Favorite.product_id).where(
                Favorite.user_id == user_id,
                Favorite.product_id.in_(product_ids),
            )
        )
        return {row[0] for row in result.all()}


favorite_crud = CRUDFavorite(Favorite)
