# app/crud/user.py
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from typing import Optional, Tuple
from sqlalchemy import select, func, or_
class CRUDUser(CRUDBase[User]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_username(self, db: AsyncSession, *, username: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: User, obj_in: UserUpdate) -> User:
        update_data = obj_in.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def authenticate(self, db: AsyncSession, *, username: str, password: str) -> Optional[User]:
        user = await self.get_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        return user.is_superuser



    async def get_multi_with_filter(
        self,
        db: AsyncSession,
        *,
        page: int = 1,
        size: int = 20,
        keyword: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_superuser: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[list[User], int]:
        """
        分页获取用户列表，支持关键词搜索和状态/角色筛选
        """
        query = select(User)

        # 关键词搜索（用户名、邮箱、姓名）
        if keyword:
            keyword_pattern = f"%{keyword}%"
            query = query.where(
                or_(
                    User.username.like(keyword_pattern),
                    User.email.like(keyword_pattern),
                    User.full_name.like(keyword_pattern),
                )
            )

        if is_active is not None:
            query = query.where(User.is_active == is_active)
        if is_superuser is not None:
            query = query.where(User.is_superuser == is_superuser)

        # 排序
        sort_field = getattr(User, sort_by, User.created_at)
        if sort_order == "asc":
            query = query.order_by(sort_field.asc())
        else:
            query = query.order_by(sort_field.desc())

        # 计算总数
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        # 分页
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)
        result = await db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def update_by_admin(
        self, db: AsyncSession, *, user_id: int, obj_in: UserUpdate
    ) -> Optional[User]:
        """管理员更新用户信息（包含密码、角色、状态）"""
        user = await self.get(db, id=user_id)
        if not user:
            return None
        update_data = obj_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(
                update_data.pop("password")
            )
        elif "password" in update_data:
            # 如果 password 字段存在但为空，则删除
            del update_data["password"]

        for field, value in update_data.items():
            setattr(user, field, value)

        await db.commit()
        await db.refresh(user)
        return user

    async def reset_password(
        self, db: AsyncSession, *, user_id: int, new_password: str
    ) -> Optional[User]:
        """重置用户密码"""
        user = await self.get(db, id=user_id)
        if not user:
            return None
        user.hashed_password = get_password_hash(new_password)
        await db.commit()
        await db.refresh(user)
        return user


# 单例实例
user = CRUDUser(User)