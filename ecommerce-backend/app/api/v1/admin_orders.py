# app/api/v1/admin_orders.py
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.order import order_crud
from app.schemas.order import OrderOut, OrderListResponse, OrderStatusUpdate
from app.api.deps import get_current_superuser
from app.models.user import User
from app.models.order import OrderStatus

router = APIRouter(tags=["admin-orders"])

@router.get("/", response_model=OrderListResponse)
async def list_all_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    status: Optional[str] = Query(None, description="按状态筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    orders, total = await order_crud.get_all_orders(
        db, status=status, skip=skip, limit=limit
    )
    return {"items": orders, "total": total}

@router.get("/{order_id}", response_model=OrderOut)
async def get_order_admin(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    order = await order_crud.get_with_items(db, id=order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order

@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """
    管理员更新订单状态
    """
    order = await order_crud.get_with_items(db, id=order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    # 校验状态值是否合法
    try:
        new_status = OrderStatus(status_update.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {[s.value for s in OrderStatus]}"
        )
    order = await order_crud.update_status(db, order=order, new_status=new_status)
    return order