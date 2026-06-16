from sqlalchemy import Column, String, Integer, DECIMAL, DateTime, Text, Index
from sqlalchemy.sql import func
from app.core.database import Base

class AlipayOrder(Base):
    __tablename__ = "alipay_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    out_trade_no = Column(String(64), unique=True, index=True, nullable=False, comment="商户订单号")
    trade_no = Column(String(64), nullable=True, comment="支付宝交易号")
    total_amount = Column(DECIMAL(10, 2), nullable=False, comment="订单金额")
    subject = Column(String(256), nullable=False, comment="商品标题")
    body = Column(Text, nullable=True, comment="商品描述")
    trade_status = Column(String(32), default="WAIT_BUYER_PAY", comment="交易状态")
    buyer_id = Column(String(64), nullable=True, comment="买家支付宝用户ID")
    gmt_create = Column(DateTime, nullable=True, comment="支付宝创建时间")
    gmt_payment = Column(DateTime, nullable=True, comment="支付宝支付时间")
    notify_time = Column(DateTime, nullable=True, comment="通知时间")
    notify_data = Column(Text, nullable=True, comment="原始异步通知数据（JSON）")
    create_time = Column(DateTime, server_default=func.now(), comment="记录创建时间")
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="记录更新时间")

    # 索引建议
    __table_args__ = (
        Index("idx_out_trade_no", "out_trade_no"),
        Index("idx_trade_status", "trade_status"),
    )