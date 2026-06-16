# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
import re
from typing import Optional

# 共享属性
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str | None = None

# 创建用户时的请求体
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r'[A-Za-z]', v) or not re.search(r'[0-9]', v):
            raise ValueError('Password must contain both letters and numbers')
        return v

# 更新用户（可选字段）
class UserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = Field(None, min_length=3, max_length=50)
    full_name: str | None = None
    password: str | None = Field(None, min_length=6)
    is_active: bool | None = None          # 新增：启用/禁用状态
    is_superuser: bool | None = None       # 新增：管理员角色

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if not re.search(r'[A-Za-z]', v) or not re.search(r'[0-9]', v):
            raise ValueError('Password must contain both letters and numbers')
        return v

# 返回给客户端的用户信息（不含密码）
class UserOut(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime 

    class Config:
        from_attributes = True  # SQLAlchemy 2.0 使用 from_attributes

class UserListResponse(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    size: int
    pages: int       