# app/api/v1/orders.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.order import order_crud
from app.schemas.order import OrderCreate, OrderOut, OrderListResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(tags=["orders"])

@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        order = await order_crud.create_order_from_cart(
            db, user_id=current_user.id, obj_in=order_in
        )
        return order
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=OrderListResponse)
async def list_user_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    orders, total = await order_crud.get_user_orders(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return {"items": orders, "total": total}

@router.get("/{order_id}", response_model=OrderOut)
async def get_order_detail(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = await order_crud.get_with_items(db, id=order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order

@router.put("/{order_id}/cancel", response_model=OrderOut)
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取消订单（仅限待处理/已支付状态）
    """
    # 关键：先获取完整预加载的订单对象
    order = await order_crud.get_with_items(db, id=order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    try:
        # 传入已预加载的 order
        order = await order_crud.cancel_order(db, order=order)
        return order
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))