from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud.product import product as product_crud
from app.schemas.product import ProductListResponse, ProductOut, ProductSearchParams

router = APIRouter(tags=["products"])


@router.get("/", response_model=ProductListResponse)
async def list_products(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    in_stock: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: Optional[str] = Query("desc"),
):
    search_params = ProductSearchParams(
        keyword=keyword,
        category=category,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        is_active=True,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    items, total = await product_crud.get_multi_with_filter(
        db,
        page=page,
        size=size,
        search_params=search_params,
    )
    pages = (total + size - 1) // size if total > 0 else 1
    return ProductListResponse(items=items, total=total, page=page, size=size, pages=pages)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await product_crud.get(db, id=product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.avg_rating = getattr(product, "avg_rating", 0)
    product.review_count = getattr(product, "review_count", 0)
    product.sales_count = getattr(product, "sales_count", 0)
    return product


@router.get("/categories/all", response_model=list[str])
async def get_categories(db: AsyncSession = Depends(get_db)):
    return await product_crud.get_categories(db)
