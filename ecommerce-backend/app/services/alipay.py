# app/services/alipay.py
import json
import requests
from datetime import datetime, timezone
from alipay import AliPay
from app.core.config import settings

def get_alipay_client() -> AliPay:
    return AliPay(
        appid=settings.ALIPAY_APP_ID,
        app_notify_url=settings.ALIPAY_NOTIFY_URL,
        app_private_key_string=open(settings.ALIPAY_PRIVATE_KEY_PATH).read(),
        alipay_public_key_string=open(settings.ALIPAY_PUBLIC_KEY_PATH).read(),
        sign_type="RSA2",
        debug=True   # 沙箱环境使用 True，生产环境 False
    )

def create_payment_url(out_trade_no: str, total_amount: str, subject: str, return_url: str = None) -> str:
    """
    生成支付宝支付页面链接（电脑网站支付）
    """
    alipay = get_alipay_client()
    order_string = alipay.api_alipay_trade_page_pay(
        out_trade_no=out_trade_no,
        total_amount=total_amount,
        subject=subject,
        return_url=return_url or settings.ALIPAY_RETURN_URL,
        notify_url=settings.ALIPAY_NOTIFY_URL
    )
    # 拼接完整支付 URL
    pay_url = settings.ALIPAY_GATEWAY + "?" + order_string
    return pay_url

def query_alipay_trade(out_trade_no: str):
    """
    查询支付宝交易状态，并打印原始响应内容以帮助调试
    """
    alipay = get_alipay_client()
    try:
        response = alipay.api_alipay_trade_query(out_trade_no=out_trade_no)
        print("支付宝查询响应（验证后）:", response)
        return response
    except Exception as e:
        print(f"支付宝查询异常: {e}")
        # 尝试获取原始响应（如果保存在异常对象中）
        if hasattr(e, 'response'):
            print("原始响应内容:", e.response)
        else:
            # 手动构造请求获取原始响应（仅用于调试）
            try:
                timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                biz_content = {"out_trade_no": out_trade_no}
                base_params = {
                    "app_id": settings.ALIPAY_APP_ID,
                    "method": "alipay.trade.query",
                    "charset": "utf-8",
                    "sign_type": "RSA2",
                    "timestamp": timestamp,
                    "version": "1.0",
                    "biz_content": json.dumps(biz_content)
                }
                # 生成待签名字符串（根据 key 排序）
                sorted_params = sorted(base_params.items())
                sign_str = "&".join([f"{k}={v}" for k, v in sorted_params])
                sign = alipay._sign(sign_str)
                base_params["sign"] = sign
                # 发送 POST 请求
                resp = requests.post(settings.ALIPAY_GATEWAY, data=base_params)
                print("支付宝原始响应（调试）:", resp.text)
                # 尝试解析 JSON
                try:
                    data = resp.json()
                    return data.get('alipay_trade_query_response', {})
                except:
                    return {"code": "99999", "msg": "解析失败", "raw": resp.text}
            except Exception as debug_e:
                print(f"调试请求也失败: {debug_e}")
        # 返回一个默认错误响应
        return {"code": "50000", "msg": "查询失败", "detail": str(e)}