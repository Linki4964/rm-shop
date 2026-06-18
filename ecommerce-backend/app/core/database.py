# app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm.decl_api import DeclarativeMeta  # 导入类型
from app.core.config import settings
from typing import AsyncGenerator, Any

# 创建异步引擎
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,  # 开发环境打印 SQL 语句
    pool_pre_ping=True,  # 防止连接失效
)

# ORM 模型基类 —— 显式指定类型
Base: DeclarativeMeta = declarative_base()

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 依赖注入：获取数据库会话
async def get_db() -> AsyncGenerator[AsyncSession, Any]:
    async with AsyncSessionLocal() as session:
        yield session

# 创建数据库表
async def init_db():
    """初始化数据库，创建所有表"""
    # 重要：导入所有模型以注册到 Base.metadata
    import app.models  # noqa: F401 — 触发 __init__.py 中的所有模型导入

    async with engine.begin() as conn:
        print("将要创建的表:", list(Base.metadata.tables.keys()))
        await conn.run_sync(Base.metadata.create_all)
        print("✅ 数据库表创建完成")

async def close_db():
    """关闭数据库连接"""
    await engine.dispose()
    print("✅ 数据库连接已关闭")