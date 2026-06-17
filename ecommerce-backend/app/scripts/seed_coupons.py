# app/scripts/seed_coupons.py
"""
添加示例优惠券数据
使用方法：python -m app.scripts.seed_coupons
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from app.core.database import AsyncSessionLocal, engine
from app.crud.coupon import coupon_crud
from app.schemas.coupon import CouponCreate

SAMPLE_COUPONS = [
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


async def seed():
    print("🔄 开始添加示例优惠券...")
    async with AsyncSessionLocal() as db:
        created = 0
        for data in SAMPLE_COUPONS:
            existing = await coupon_crud.get_by_code(db, code=data["code"])
            if existing:
                print(f"⚠️  已存在，跳过: {data['code']}")
                continue
            await coupon_crud.create(db, obj_in=CouponCreate(**data).model_dump())
            created += 1
            print(f"✅ 创建优惠券: {data['code']} ({data['discount_type']})")
        print(f"\n📊 完成！创建 {created} 张优惠券")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
