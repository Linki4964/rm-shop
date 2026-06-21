# app/core/database.py
from typing import Any, AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm.decl_api import DeclarativeMeta

from app.core.config import settings
from app.core.schema_sync import sync_missing_tables_and_columns


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,
)

Base: DeclarativeMeta = declarative_base()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, Any]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """初始化数据库结构。

    除了创建缺失表之外，也会为已存在的表补齐缺失字段。
    """
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        print("将要同步的数据表:", list(Base.metadata.tables.keys()))
        await conn.run_sync(sync_missing_tables_and_columns, Base.metadata)
        print("数据库结构同步完成")


async def close_db():
    """关闭数据库连接。"""
    await engine.dispose()
    print("数据库连接已关闭")
