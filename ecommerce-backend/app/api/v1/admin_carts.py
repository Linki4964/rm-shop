from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.crud.cart import cart as cart_crud
from app.crud.user import user as user_crud
from app.models.user import User
from app.models.cart import CartItem
from app.schemas.cart import CartItemOut, CartResponse
from app.api.deps import get_current_superuser
from app.schemas.cart import AdminCartOverviewItem, AdminCartOverviewResponse, GlobalCartStats

router = APIRouter(tags=["admin-carts"])


@router.get("/stats", response_model=GlobalCartStats)
async def get_global_cart_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """获取全局购物车统计（所有用户购物车中的商品总数量）"""
    stats = await cart_crud.get_global_cart_stats(db)
    return stats


@router.get("/", response_model=AdminCartOverviewResponse)
async def list_user_carts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None, description="搜索用户名/邮箱"),
):
    """获取所有用户的购物车概览（管理员）"""
    # 查询有购物车记录的用户
    subq = (
        select(
            CartItem.user_id,
            func.count(CartItem.id).label("total_items"),
            func.sum(CartItem.quantity).label("total_quantity")
        )
        .group_by(CartItem.user_id)
        .subquery()
    )
    query = (
        select(User, subq.c.total_items, subq.c.total_quantity)
        .outerjoin(subq, User.id == subq.c.user_id)
    )
    if keyword:
        query = query.where(
            or_(User.username.like(f"%{keyword}%"), User.email.like(f"%{keyword}%"))
        )
    # 排序
    query = query.order_by(User.id)

    # 计数
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # 分页
    offset = (page - 1) * size
    query = query.offset(offset).limit(size)
    result = await db.execute(query)
    rows = result.all()

    items = []
    for user, total_items, total_quantity in rows:
        items.append(AdminCartOverviewItem(
            user_id=user.id,
            username=user.username,
            email=user.email,
            total_items=total_items or 0,
            total_quantity=total_quantity or 0,
        ))
    pages = (total + size - 1) // size if total > 0 else 1
    return AdminCartOverviewResponse(items=items, total=total, page=page, size=size, pages=pages)





@router.get("/{user_id}", response_model=CartResponse)
async def get_user_cart_admin(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """获取指定用户的购物车详情（管理员）"""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    items = await cart_crud.get_user_cart(db, user_id=user_id)
    total_items = len(items)
    total_quantity = sum(item.quantity for item in items)
    return CartResponse(items=items, total_items=total_items, total_quantity=total_quantity)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cart_item_admin(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """删除任意购物车项（管理员）"""
    result = await db.execute(select(CartItem).where(CartItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    await db.delete(item)
    await db.commit()


@router.delete("/user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def clear_user_cart_admin(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """清空指定用户的购物车（管理员）"""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await cart_crud.clear_cart(db, user_id=user_id)