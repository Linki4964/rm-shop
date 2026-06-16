# app/crud/alipayOrder.py
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import json
from datetime import datetime

from app.models.alipayOrder import AlipayOrder  # 根据你的实际路径调整
from app.schemas.alipayOrder import OrderCreateRequest  # 根据实际路径

async def get_order_by_out_trade_no(db: AsyncSession, out_trade_no: str) -> Optional[AlipayOrder]:
    """根据商户订单号查询订单"""
    stmt = select(AlipayOrder).where(AlipayOrder.out_trade_no == out_trade_no)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def create_order(db: AsyncSession, order_data: OrderCreateRequest) -> AlipayOrder:
    """创建订单（状态为 WAIT_BUYER_PAY）"""
    db_order = AlipayOrder(
        out_trade_no=order_data.out_trade_no,
        total_amount=order_data.total_amount,
        subject=order_data.subject,
        body=order_data.body,
        trade_status="WAIT_BUYER_PAY"
    )
    db.add(db_order)
    await db.commit()
    await db.refresh(db_order)
    return db_order

async def update_order_by_notify(db: AsyncSession, out_trade_no: str, notify_data: dict) -> AlipayOrder:
    """
    根据支付宝异步通知更新订单状态（幂等处理）
    """
    order = await get_order_by_out_trade_no(db, out_trade_no)
    if not order:
        raise ValueError(f"订单不存在: {out_trade_no}")

    trade_status = notify_data.get("trade_status")
    
    # 如果已经是 SUCCESS，避免重复更新（幂等）
    if order.trade_status == "SUCCESS":
        return order

    # 更新支付宝交易号、买家ID等
    order.trade_no = notify_data.get("trade_no")
    order.buyer_id = notify_data.get("buyer_id")
    
    # 时间字段转换
    if notify_data.get("gmt_create"):
        order.gmt_create = datetime.strptime(notify_data["gmt_create"], "%Y-%m-%d %H:%M:%S")
    if notify_data.get("gmt_payment"):
        order.gmt_payment = datetime.strptime(notify_data["gmt_payment"], "%Y-%m-%d %H:%M:%S")
    if notify_data.get("notify_time"):
        order.notify_time = datetime.strptime(notify_data["notify_time"], "%Y-%m-%d %H:%M:%S")
    
    # 保存原始通知数据
    order.notify_data = json.dumps(notify_data, ensure_ascii=False)
    
    # 更新交易状态
    if trade_status in ("TRADE_SUCCESS", "TRADE_FINISHED"):
        order.trade_status = "SUCCESS"
    elif trade_status == "TRADE_CLOSED":
        order.trade_status = "CLOSED"
    elif trade_status == "WAIT_BUYER_PAY":
        order.trade_status = "WAIT_BUYER_PAY"
    else:
        order.trade_status = trade_status
    
    await db.commit()
    await db.refresh(order)
    return order

async def update_order_status(db: AsyncSession, out_trade_no: str, trade_status: str) -> Optional[AlipayOrder]:
    """手动更新订单状态"""
    order = await get_order_by_out_trade_no(db, out_trade_no)
    if order:
        order.trade_status = trade_status
        await db.commit()
        await db.refresh(order)
    return order