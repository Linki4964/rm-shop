from typing import Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.order import OrderItem
from app.models.product import Product
from app.models.review import Review
from app.schemas.product import ProductCreate, ProductSearchParams, ProductUpdate


class CRUDProduct(CRUDBase[Product]):
    async def get_by_name(self, db: AsyncSession, *, name: str) -> Optional[Product]:
        result = await db.execute(select(Product).where(Product.name == name))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: ProductCreate) -> Product:
        db_obj = Product(
            name=obj_in.name,
            description=obj_in.description,
            price=obj_in.price,
            stock=obj_in.stock,
            image_url=obj_in.image_url,
            category=obj_in.category,
            is_active=obj_in.is_active,
            features=obj_in.features,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_with_filter(
        self,
        db: AsyncSession,
        *,
        page: int = 1,
        size: int = 20,
        search_params: Optional[ProductSearchParams] = None,
    ) -> Tuple[list[Product], int]:
        sales_subq = (
            select(
                OrderItem.product_id.label("product_id"),
                func.coalesce(func.sum(OrderItem.quantity), 0).label("sales_count"),
            )
            .group_by(OrderItem.product_id)
            .subquery()
        )
        review_subq = (
            select(
                Review.product_id.label("product_id"),
                func.coalesce(func.avg(Review.rating), 0).label("avg_rating"),
                func.count(Review.id).label("review_count"),
            )
            .group_by(Review.product_id)
            .subquery()
        )

        query = (
            select(
                Product,
                func.coalesce(sales_subq.c.sales_count, 0).label("sales_count"),
                func.coalesce(review_subq.c.avg_rating, 0).label("avg_rating"),
                func.coalesce(review_subq.c.review_count, 0).label("review_count"),
            )
            .outerjoin(sales_subq, sales_subq.c.product_id == Product.id)
            .outerjoin(review_subq, review_subq.c.product_id == Product.id)
        )

        if search_params:
            if search_params.keyword:
                keyword_pattern = f"%{search_params.keyword}%"
                query = query.where(
                    or_(
                        Product.name.like(keyword_pattern),
                        Product.description.like(keyword_pattern),
                    )
                )
            if search_params.category:
                query = query.where(Product.category == search_params.category)
            if search_params.min_price is not None:
                query = query.where(Product.price >= search_params.min_price)
            if search_params.max_price is not None:
                query = query.where(Product.price <= search_params.max_price)
            if search_params.is_active is not None:
                query = query.where(Product.is_active == search_params.is_active)
            if search_params.in_stock:
                query = query.where(Product.stock > 0)

            sort_map = {
                "price": Product.price,
                "stock": Product.stock,
                "created_at": Product.created_at,
                "sales_count": func.coalesce(sales_subq.c.sales_count, 0),
                "avg_rating": func.coalesce(review_subq.c.avg_rating, 0),
            }
            sort_field = sort_map.get(search_params.sort_by or "created_at", Product.created_at)
            if search_params.sort_order == "asc":
                query = query.order_by(sort_field.asc(), Product.created_at.desc())
            else:
                query = query.order_by(sort_field.desc(), Product.created_at.desc())
        else:
            query = query.order_by(Product.created_at.desc())

        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        offset = (page - 1) * size
        rows = (await db.execute(query.offset(offset).limit(size))).all()
        items: list[Product] = []
        for product, sales_count, avg_rating, review_count in rows:
            product.sales_count = int(sales_count or 0)
            product.avg_rating = round(float(avg_rating or 0), 1)
            product.review_count = int(review_count or 0)
            items.append(product)
        return items, total

    async def get_categories(self, db: AsyncSession) -> list[str]:
        result = await db.execute(
            select(Product.category).where(Product.category.isnot(None)).distinct()
        )
        return [row for row in result.scalars().all() if row]

    async def update(self, db: AsyncSession, *, db_obj: Product, obj_in: ProductUpdate) -> Product:
        update_data = obj_in.model_dump(exclude_unset=True)
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def get_active_products(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Product]:
        result = await db.execute(
            select(Product)
            .where(Product.is_active == True)
            .where(Product.stock > 0)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def check_stock(
        self,
        db: AsyncSession,
        *,
        product_id: int,
        quantity: int,
    ) -> Tuple[bool, Optional[Product]]:
        product = await self.get(db, id=product_id)
        if not product:
            return False, None
        if not product.is_active:
            return False, product
        if product.stock < quantity:
            return False, product
        return True, product

    async def reduce_stock(
        self,
        db: AsyncSession,
        *,
        product_id: int,
        quantity: int,
    ) -> Optional[Product]:
        product = await self.get(db, id=product_id)
        if product:
            product.stock -= quantity
            await db.commit()
            await db.refresh(product)
        return product

    async def increase_stock(
        self,
        db: AsyncSession,
        *,
        product_id: int,
        quantity: int,
    ) -> Optional[Product]:
        product = await self.get(db, id=product_id)
        if product:
            product.stock += quantity
            await db.commit()
            await db.refresh(product)
        return product


product = CRUDProduct(Product)
