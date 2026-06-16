# app/api/v1/admin_users.py
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud.user import user as user_crud
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.schemas.user import UserListResponse
from app.api.deps import get_current_superuser
from app.models.user import User

router = APIRouter(tags=["admin-users"])


@router.get("/", response_model=UserListResponse)
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None, description="搜索关键词（用户名/邮箱/姓名）"),
    is_active: Optional[bool] = Query(None, description="是否启用"),
    is_superuser: Optional[bool] = Query(None, description="是否管理员"),
    sort_by: str = Query("created_at", description="排序字段"),
    sort_order: str = Query("desc", description="asc/desc")
):
    """获取用户列表（仅管理员）"""
    items, total = await user_crud.get_multi_with_filter(
        db,
        page=page,
        size=size,
        keyword=keyword,
        is_active=is_active,
        is_superuser=is_superuser,
        sort_by=sort_by,
        sort_order=sort_order
    )
    pages = (total + size - 1) // size if total > 0 else 1
    return UserListResponse(items=items, total=total, page=page, size=size, pages=pages)


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """创建用户（仅管理员）"""
    # 检查邮箱和用户名是否已存在
    existing_email = await user_crud.get_by_email(db, email=user_in.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_username = await user_crud.get_by_username(db, username=user_in.username)
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    # 创建用户（直接使用 CRUD 的 create，注意 UserCreate 中包含 password）
    user = await user_crud.create(db, obj_in=user_in)
    return user


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """更新用户信息（仅管理员，可修改角色/状态/密码）"""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 如果修改邮箱，检查唯一性
    if user_in.email and user_in.email != user.email:
        existing = await user_crud.get_by_email(db, email=user_in.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
    # 如果修改用户名，检查唯一性
    if user_in.username and user_in.username != user.username:
        existing = await user_crud.get_by_username(db, username=user_in.username)
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    updated_user = await user_crud.update_by_admin(db, user_id=user_id, obj_in=user_in)
    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """删除用户（仅管理员）"""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # 不允许删除自己
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await user_crud.remove(db, id=user_id)


@router.patch("/{user_id}/toggle-status", response_model=UserOut)
async def toggle_user_status(
    user_id: int,
    is_active: bool = Query(..., description="启用/禁用"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """切换用户启用状态"""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # 不允许禁用自己
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own status")
    user.is_active = is_active
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/{user_id}/reset-password", response_model=UserOut)
async def reset_user_password(
    user_id: int,
    new_password: str = Query(..., min_length=6),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """重置用户密码（仅管理员）"""
    user = await user_crud.reset_password(db, user_id=user_id, new_password=new_password)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user