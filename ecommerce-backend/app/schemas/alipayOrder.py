from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from decimal import Decimal

class OrderCreateRequest(BaseModel):
    out_trade_no: str = Field(..., description="商户订单号")
    total_amount: Decimal = Field(..., description="金额（元）", example=0.01)
    subject: str = Field(..., description="商品标题")
    body: Optional[str] = Field(None, description="商品描述")

class OrderResponse(BaseModel):
    id: int
    out_trade_no: str
    trade_no: Optional[str] = None
    total_amount: Decimal
    subject: str
    body: Optional[str] = None
    trade_status: str
    buyer_id: Optional[str] = None
    gmt_create: Optional[datetime] = None
    gmt_payment: Optional[datetime] = None
    create_time: datetime
    update_time: datetime

    model_config = ConfigDict(from_attributes=True)

class AlipayNotifySchema(BaseModel):
    """支付宝异步通知参数（仅核心字段，实际会动态解析）"""
    notify_time: Optional[str] = None
    notify_type: Optional[str] = None
    notify_id: Optional[str] = None
    app_id: Optional[str] = None
    charset: Optional[str] = None
    version: Optional[str] = None
    sign_type: Optional[str] = None
    sign: Optional[str] = None
    trade_no: Optional[str] = None
    out_trade_no: Optional[str] = None
    out_biz_no: Optional[str] = None
    buyer_id: Optional[str] = None
    buyer_logon_id: Optional[str] = None
    seller_id: Optional[str] = None
    seller_email: Optional[str] = None
    trade_status: Optional[str] = None
    total_amount: Optional[str] = None
    receipt_amount: Optional[str] = None
    invoice_amount: Optional[str] = None
    buyer_pay_amount: Optional[str] = None
    point_amount: Optional[str] = None
    refund_fee: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    gmt_create: Optional[str] = None
    gmt_payment: Optional[str] = None
    gmt_refund: Optional[str] = None
    gmt_close: Optional[str] = None
    fund_bill_list: Optional[str] = None
    passback_params: Optional[str] = None
    voucher_detail_list: Optional[str] = None