"""
一键初始化数据库。

使用方法：
python -m app.scripts.init_db
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta

from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import Base, AsyncSessionLocal, engine
from app.core.schema_sync import sync_missing_tables_and_columns


def create_database_if_not_exists():
    """如果数据库不存在，则先创建数据库。"""
    url = settings.DATABASE_URL
    db_name = url.rsplit("/", 1)[-1].split("?")[0]
    base_url = url.rsplit("/", 1)[0] + "/mysql"
    sync_url = base_url.replace("mysql+aiomysql://", "mysql+pymysql://")

    sync_engine = create_engine(sync_url, echo=False)
    with sync_engine.connect() as conn:
        result = conn.execute(text(f"SHOW DATABASES LIKE '{db_name}'"))
        if not result.fetchone():
            conn.execute(
                text(
                    f"CREATE DATABASE `{db_name}` "
                    "DEFAULT CHARACTER SET utf8mb4 "
                    "COLLATE utf8mb4_unicode_ci"
                )
            )
            print(f"数据库 '{db_name}' 已创建")
        else:
            print(f"数据库 '{db_name}' 已存在")
    sync_engine.dispose()


async def create_tables():
    """创建缺失表，并给旧表补齐缺失字段。"""
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(sync_missing_tables_and_columns, Base.metadata)
    print(f"数据表已创建/同步: {list(Base.metadata.tables.keys())}")


async def seed_data():
    """导入种子数据。"""
    from app.crud.coupon import coupon_crud
    from app.crud.product import product as product_crud
    from app.schemas.coupon import CouponCreate
    from app.schemas.product import ProductCreate

    products = [
        {
            "name": "iPhone 15 Pro Max",
            "description": "苹果最新旗舰手机，A17 Pro 芯片，钛金属设计",
            "price": 9999.00,
            "stock": 50,
            "image_url": "/products/iphone15.jpg",
            "category": "手机数码",
        },
        {
            "name": "MacBook Pro 14",
            "description": "M3 Pro 芯片，14 英寸 Liquid Retina XDR 显示屏",
            "price": 14999.00,
            "stock": 30,
            "image_url": "/products/macbookpro.jpg",
            "category": "电脑办公",
        },
        {
            "name": "AirPods Pro 2",
            "description": "主动降噪无线耳机，自适应音频",
            "price": 1899.00,
            "stock": 100,
            "image_url": "/products/airpods.jpg",
            "category": "影音娱乐",
        },
        {
            "name": "小米手环 8 Pro",
            "description": "1.74 英寸 AMOLED 大屏，独立 GPS",
            "price": 399.00,
            "stock": 200,
            "image_url": "/products/xiaomi.jpg",
            "category": "智能穿戴",
        },
        {
            "name": "Sony WH-1000XM5",
            "description": "旗舰降噪耳机，30 小时续航",
            "price": 2499.00,
            "stock": 45,
            "image_url": "/products/sony.jpg",
            "category": "影音娱乐",
        },
        {
            "name": "任天堂 Switch OLED",
            "description": "7 英寸 OLED 屏幕，续航增强版",
            "price": 2599.00,
            "stock": 25,
            "image_url": "/products/switch.jpg",
            "category": "游戏娱乐",
        },
        {
            "name": "戴尔 XPS 15",
            "description": "3.5K OLED 触控屏，i9 处理器",
            "price": 18999.00,
            "stock": 15,
            "image_url": "/products/dell.jpg",
            "category": "电脑办公",
        },
    ]

    coupons = [
        {
            "code": "WELCOME10",
            "discount_type": "percentage",
            "discount_value": 10,
            "min_order_amount": 100,
            "usage_limit": 100,
            "expires_at": datetime.now() + timedelta(days=90),
        },
        {
            "code": "SAVE50",
            "discount_type": "fixed",
            "discount_value": 50,
            "min_order_amount": 200,
            "usage_limit": 50,
            "expires_at": datetime.now() + timedelta(days=30),
        },
        {
            "code": "NEW100",
            "discount_type": "fixed",
            "discount_value": 100,
            "min_order_amount": 500,
            "usage_limit": 20,
            "expires_at": datetime.now() + timedelta(days=60),
        },
        {
            "code": "SUPER20",
            "discount_type": "percentage",
            "discount_value": 20,
            "min_order_amount": 300,
            "usage_limit": 30,
            "expires_at": datetime.now() + timedelta(days=15),
        },
    ]

    async with AsyncSessionLocal() as db:
        p_created, p_skipped = 0, 0
        for item in products:
            existing = await product_crud.get_by_name(db, name=item["name"])
            if existing:
                p_skipped += 1
                continue
            await product_crud.create(db, obj_in=ProductCreate(**item))
            p_created += 1

        c_created, c_skipped = 0, 0
        for item in coupons:
            existing = await coupon_crud.get_by_code(db, code=item["code"])
            if existing:
                c_skipped += 1
                continue
            await coupon_crud.create(db, obj_in=CouponCreate(**item))
            c_created += 1

        print(f"商品种子数据: 新增 {p_created}，跳过 {p_skipped}")
        print(f"优惠券种子数据: 新增 {c_created}，跳过 {c_skipped}")


async def main():
    print("EasyShop 数据库初始化开始")
    print(f"数据库连接: {settings.DATABASE_URL}")

    create_database_if_not_exists()
    await create_tables()
    await seed_data()

    await engine.dispose()
    print("初始化完成")
    print("启动命令: uvicorn app.main:app --reload")


if __name__ == "__main__":
    asyncio.run(main())
