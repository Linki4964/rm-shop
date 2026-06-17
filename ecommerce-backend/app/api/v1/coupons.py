# app/api/v1/coupons.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.coupon import coupon_crud
from app.schemas.coupon import (
    CouponCreate, CouponUpdate, CouponOut,
    CouponValidateRequest, CouponValidateResponse,
    CouponAvailableItem,
)
from app.api.deps import get_current_user, get_current_superuser
from app.models.user import User
from typing import List

router = APIRouter(tags=["coupons"])

# ====== 公开接口：验证优惠券 ======
@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    req: CouponValidateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await coupon_crud.validate(
        db, code=req.code.upper(), order_amount=req.order_amount
    )
    return result


# ====== 公开接口：获取可用优惠券列表 ======
@router.get("/available", response_model=list[CouponAvailableItem])
async def list_available_coupons(
    order_amount: float = Query(0, ge=0, description="当前订单金额"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await coupon_crud.get_available(db, order_amount=order_amount)


# ====== 管理员接口 ======
admin_router = APIRouter(tags=["admin-coupons"])


@admin_router.get("/", response_model=List[CouponOut])
async def list_coupons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    coupons, _ = await coupon_crud.get_multi(db, skip=skip, limit=limit)
    return coupons


@admin_router.post("/", response_model=CouponOut, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    coupon_in: CouponCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    existing = await coupon_crud.get_by_code(db, code=coupon_in.code.upper())
    if existing:
        raise HTTPException(status_code=400, detail="优惠券代码已存在")
    coupon_in.code = coupon_in.code.upper()
    return await coupon_crud.create(db, obj_in=coupon_in)


@admin_router.put("/{coupon_id}", response_model=CouponOut)
async def update_coupon(
    coupon_id: int,
    coupon_in: CouponUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    coupon = await coupon_crud.get(db, id=coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    if coupon_in.code:
        coupon_in.code = coupon_in.code.upper()
    return await coupon_crud.update(db, db_obj=coupon, obj_in=coupon_in)


@admin_router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    coupon = await coupon_crud.get(db, id=coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    await coupon_crud.remove(db, id=coupon_id)
    return {"detail": "优惠券已删除"}
