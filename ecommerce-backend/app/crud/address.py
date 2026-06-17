# app/crud/address.py
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.crud.base import CRUDBase
from app.models.address import UserAddress


class CRUDAddress(CRUDBase[UserAddress]):
    async def get_user_addresses(self, db: AsyncSession, *, user_id: int) -> list[UserAddress]:
        result = await db.execute(
            select(UserAddress)
            .where(UserAddress.user_id == user_id)
            .order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc())
        )
        return list(result.scalars().all())

    async def set_default(self, db: AsyncSession, *, address_id: int, user_id: int) -> None:
        # 先取消该用户所有默认
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == user_id)
            .values(is_default=False)
        )
        # 设置新默认
        await db.execute(
            update(UserAddress)
            .where(UserAddress.id == address_id, UserAddress.user_id == user_id)
            .values(is_default=True)
        )
        await db.commit()


address_crud = CRUDAddress(UserAddress)
