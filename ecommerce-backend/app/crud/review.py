# app/crud/review.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.crud.base import CRUDBase
from app.models.review import Review


class CRUDReview(CRUDBase[Review]):
    async def get_product_reviews(
        self, db: AsyncSession, *, product_id: int
    ) -> list[Review]:
        result = await db.execute(
            select(Review)
            .where(Review.product_id == product_id)
            .options(selectinload(Review.user))
            .order_by(Review.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_product_stats(
        self, db: AsyncSession, *, product_id: int
    ) -> dict:
        result = await db.execute(
            select(
                func.count(Review.id),
                func.avg(Review.rating)
            ).where(Review.product_id == product_id)
        )
        count, avg = result.one()
        avg = round(float(avg or 0), 1)  # 保留 1 位小数
        count = int(count or 0)

        # 分布
        dist_result = await db.execute(
            select(Review.rating, func.count(Review.id))
            .where(Review.product_id == product_id)
            .group_by(Review.rating)
        )
        dist = {str(i): 0 for i in range(1, 6)}
        for rating, cnt in dist_result.all():
            dist[str(rating)] = cnt

        return {"average": avg, "count": count, "distribution": dist}


review_crud = CRUDReview(Review)
