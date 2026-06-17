# app/scripts/init_db.py
"""
一键初始化数据库 — 适用于首次部署
使用方法：python -m app.scripts.init_db
"""
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, create_engine
from app.core.config import settings
from app.core.database import Base, engine


def create_database_if_not_exists():
    """用 pymysql 创建数据库（如果不存在）"""
    url = settings.DATABASE_URL
    db_name = url.rsplit("/", 1)[-1].split("?")[0]
    # 构建无数据库名的连接 URL
    base_url = url.rsplit("/", 1)[0] + "/mysql"
    sync_url = base_url.replace("mysql+aiomysql://", "mysql+pymysql://")

    sync_engine = create_engine(sync_url, echo=False)
    with sync_engine.connect() as conn:
        result = conn.execute(text(f"SHOW DATABASES LIKE '{db_name}'"))
        if not result.fetchone():
            conn.execute(text(f"CREATE DATABASE `{db_name}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            print(f"✅ 数据库 '{db_name}' 已创建")
        else:
            print(f"ℹ️  数据库 '{db_name}' 已存在")
    sync_engine.dispose()


async def create_tables():
    """创建所有表"""
    import app.models  # noqa — 注册所有模型

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(f"✅ 数据表已创建: {list(Base.metadata.tables.keys())}")


async def seed_data():
    """导入种子数据"""
    from app.core.database import AsyncSessionLocal
    from app.crud.product import product as product_crud
    from app.crud.coupon import coupon_crud
    from app.schemas.product import ProductCreate
    from app.schemas.coupon import CouponCreate
    from datetime import datetime, timedelta

    products = [
        {"name": "iPhone 15 Pro Max", "description": "苹果最新旗舰手机，A17 Pro芯片，钛金属设计", "price": 9999.00, "stock": 50, "image_url": "https://picsum.photos/400/400?random=1", "category": "手机数码"},
        {"name": "MacBook Pro 14", "description": "M3 Pro芯片，14英寸Liquid Retina XDR显示屏", "price": 14999.00, "stock": 30, "image_url": "https://picsum.photos/400/400?random=2", "category": "电脑办公"},
        {"name": "AirPods Pro 2", "description": "主动降噪无线耳机，自适应音频", "price": 1899.00, "stock": 100, "image_url": "https://picsum.photos/400/400?random=3", "category": "影音娱乐"},
        {"name": "小米手环8 Pro", "description": "1.74英寸AMOLED大屏，独立GPS", "price": 399.00, "stock": 200, "image_url": "https://picsum.photos/400/400?random=4", "category": "智能穿戴"},
        {"name": "Sony WH-1000XM5", "description": "顶级降噪耳机，30小时续航", "price": 2499.00, "stock": 45, "image_url": "https://picsum.photos/400/400?random=5", "category": "影音娱乐"},
        {"name": "任天堂Switch OLED", "description": "7英寸OLED屏幕，续航增强版", "price": 2599.00, "stock": 25, "image_url": "https://picsum.photos/400/400?random=6", "category": "游戏娱乐"},
        {"name": "戴尔XPS 15", "description": "3.5K OLED触控屏，i9处理器", "price": 18999.00, "stock": 15, "image_url": "https://picsum.photos/400/400?random=7", "category": "电脑办公"},
    ]

    coupons = [
        {"code": "WELCOME10", "discount_type": "percentage", "discount_value": 10, "min_order_amount": 100, "usage_limit": 100, "expires_at": datetime.now() + timedelta(days=90)},
        {"code": "SAVE50", "discount_type": "fixed", "discount_value": 50, "min_order_amount": 200, "usage_limit": 50, "expires_at": datetime.now() + timedelta(days=30)},
        {"code": "NEW100", "discount_type": "fixed", "discount_value": 100, "min_order_amount": 500, "usage_limit": 20, "expires_at": datetime.now() + timedelta(days=60)},
        {"code": "SUPER20", "discount_type": "percentage", "discount_value": 20, "min_order_amount": 300, "usage_limit": 30, "expires_at": datetime.now() + timedelta(days=15)},
    ]

    async with AsyncSessionLocal() as db:
        p_created, p_skipped = 0, 0
        for p in products:
            existing = await product_crud.get_by_name(db, name=p["name"])
            if existing:
                p_skipped += 1
                continue
            await product_crud.create(db, obj_in=ProductCreate(**p).model_dump())
            p_created += 1

        c_created, c_skipped = 0, 0
        for c in coupons:
            existing = await coupon_crud.get_by_code(db, code=c["code"])
            if existing:
                c_skipped += 1
                continue
            await coupon_crud.create(db, obj_in=CouponCreate(**c).model_dump())
            c_created += 1

        print(f"📦 商品: +{p_created} 跳过{p_skipped}")
        print(f"🎫 优惠券: +{c_created} 跳过{c_skipped}")


async def main():
    print("🚀 EasyShop 数据库初始化开始...")
    print(f"   URL: {settings.DATABASE_URL}")

    create_database_if_not_exists()
    await create_tables()
    await seed_data()

    await engine.dispose()
    print("✅ 初始化完成！")
    print("   运行: uvicorn app.main:app --reload")


if __name__ == "__main__":
    asyncio.run(main())
