# app/api/v1/addresses.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.address import address_crud
from app.schemas.address import AddressCreate, AddressUpdate, AddressOut
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(tags=["addresses"])


@router.get("/", response_model=list[AddressOut])
async def list_addresses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await address_crud.get_user_addresses(db, user_id=current_user.id)


@router.post("/", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
async def create_address(
    addr_in: AddressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = addr_in.model_dump()
    data["user_id"] = current_user.id
    # 如果设为默认，先取消其他默认
    if data["is_default"]:
        created = await address_crud.create(db, obj_in=data)
        await address_crud.set_default(db, address_id=created.id, user_id=current_user.id)
        return created
    return await address_crud.create(db, obj_in=data)


@router.put("/{address_id}", response_model=AddressOut)
async def update_address(
    address_id: int,
    addr_in: AddressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    addr = await address_crud.get(db, id=address_id)
    if not addr or addr.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="地址不存在")
    update_data = addr_in.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        await address_crud.set_default(db, address_id=address_id, user_id=current_user.id)
    return await address_crud.update(db, db_obj=addr, obj_in=update_data)


@router.delete("/{address_id}")
async def delete_address(
    address_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    addr = await address_crud.get(db, id=address_id)
    if not addr or addr.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="地址不存在")
    await address_crud.remove(db, id=address_id)
    return {"detail": "地址已删除"}
