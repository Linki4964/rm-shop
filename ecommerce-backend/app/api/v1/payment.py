from fastapi import APIRouter, Depends, HTTPException, Request, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.order import order_crud
from app.api.deps import get_current_user
from app.models.user import User
from app.services.alipay import query_alipay_trade
from typing import Dict
from app.schemas.alipayOrder import OrderCreateRequest, OrderResponse
from app.core.config import settings
from app.crud.alipayOrder import (
    create_order,
    get_order_by_out_trade_no,
    update_order_by_notify,
)
from app.services.alipay import create_payment_url
import logging

router = APIRouter(tags=["payment"])

logger = logging.getLogger(__name__)


@router.get("/alipay/query")
async def query_alipay_payment(
    order_id: int = Query(..., description="订单ID"),
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    """
    查询订单的支付宝支付状态
    """
    # 1. 查询订单并验证权限
    order = await order_crud.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    # 2. 调用支付宝查询接口
    out_trade_no = order.order_number
    result = query_alipay_trade(order.order_number)

    # 3. 处理查询结果
    if result.get("code") == "10000":  # 接口调用成功
        trade_status = result.get("trade_status")
        if trade_status == "TRADE_SUCCESS":
            # 支付成功，更新订单状态
            order.status = "paid"
            await db.commit()
            await db.refresh(order)
            return {
                "status": "paid",
                "message": "支付成功",
                "trade_no": result.get("trade_no"),
                "out_trade_no": out_trade_no,
            }
        elif trade_status == "TRADE_CLOSED":
            return {
                "status": "closed",
                "message": "交易已关闭",
                "trade_no": result.get("trade_no"),
            }
        elif trade_status == "WAIT_BUYER_PAY":
            return {
                "status": "pending",
                "message": "等待买家付款",
                "trade_no": result.get("trade_no"),
            }
        else:
            return {
                "status": "unknown",
                "message": f"未知交易状态: {trade_status}",
                "trade_no": result.get("trade_no"),
            }
    else:
        # 调用支付宝接口失败
        error_msg = result.get("sub_msg") or result.get("msg") or "查询失败"
        return {"status": "error", "message": error_msg, "code": result.get("code")}


# ========== 支付创建接口 ==========
@router.post("/alipay/create", response_model=Dict)
async def create_payment(
    order_id: int,
    order_req: OrderCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    1. 保存订单到数据库 (状态 WAIT_BUYER_PAY)
    2. 调用支付宝生成支付链接
    3. 返回支付链接给前端
    """
    # 1. 校验订单：存在、归属当前用户、状态为待支付
    order = await order_crud.get_with_items(db, id=order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="订单状态不可支付")

    # 2. 若 out_trade_no 已存在，直接复用已有订单生成支付链接
    existing = await get_order_by_out_trade_no(db, order_req.out_trade_no)
    target_order = existing if existing else await create_order(db, order_req)

    # 3. 生成支付宝支付链接
    try:
        pay_url = create_payment_url(
            out_trade_no=target_order.out_trade_no,
            total_amount=str(target_order.total_amount),
            subject=target_order.subject,
        )
    except Exception as e:
        logger.error(f"生成支付链接失败: {e}")
        raise HTTPException(status_code=500, detail="支付宝接口异常")

    return {"out_trade_no": target_order.out_trade_no, "pay_url": pay_url}


# ========== 支付宝异步通知接口 ==========
@router.post("/alipay/notify")
async def alipay_notify(request: Request, db: AsyncSession = Depends(get_db)):
    """
    接收支付宝异步通知，验签并更新订单状态
    """
    # 1. 获取 POST 表单数据
    form_data = await request.form()
    notify_params = dict(form_data)
    logger.info(f"收到异步通知: {notify_params}")

    # 2. 验签（根据配置开关）
    if settings.VERIFY_SIGN:
        from alipay import AliPay

        alipay = AliPay(
            appid=settings.ALIPAY_APP_ID,
            app_notify_url=settings.ALIPAY_NOTIFY_URL,
            app_private_key_string=settings.ALIPAY_PRIVATE_KEY_PATH,
            alipay_public_key_string=settings.ALIPAY_PUBLIC_KEY_PATH,
            sign_type="RSA2",
            debug=True,
        )
        # 从参数中提取 sign
        sign = notify_params.pop("sign", None)
        if not sign:
            logger.error("通知缺少签名")
            return Response("fail", media_type="text/plain")

        # 验证签名（注意：verify 方法需要传入原始参数字典和签名）
        verify_result = alipay.verify(notify_params, sign)
        if not verify_result:
            logger.error("验签失败")
            return Response("fail", media_type="text/plain")
        logger.info("验签通过")
    else:
        logger.warning("验签已关闭（仅测试环境）")

    # 3. 处理业务（根据 out_trade_no 更新订单）
    out_trade_no = notify_params.get("out_trade_no")
    trade_status = notify_params.get("trade_status")

    if not out_trade_no:
        logger.error("通知缺少 out_trade_no")
        return Response("fail", media_type="text/plain")

    try:
        # 更新订单（内部会做幂等处理）
        updated_order = await update_order_by_notify(db, out_trade_no, notify_params)
        logger.info(f"订单 {out_trade_no} 状态更新为 {updated_order.trade_status}")
    except ValueError as e:
        logger.error(f"更新订单失败: {e}")
        return Response("fail", media_type="text/plain")

    # 4. 返回支付宝要求的 success
    return Response("success", media_type="text/plain")


# ========== 查询订单接口 ==========
@router.get("/alipay/order/{out_trade_no}", response_model=OrderResponse)
async def get_order(out_trade_no: str, db: AsyncSession = Depends(get_db)):
    order = await get_order_by_out_trade_no(db, out_trade_no)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order