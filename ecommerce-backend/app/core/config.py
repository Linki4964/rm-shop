# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 数据库连接字符串
    DATABASE_URL: str = "mysql+aiomysql://root:flag{GG_1ove_pz_pc}@localhost:3306/ecommerce_db"

    # JWT 密钥（生产环境务必修改为复杂随机字符串）
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


# class Settings(BaseSettings):
    # ... 原有配置

    # 支付宝配置
    ALIPAY_APP_ID: str = "9021000164666204"
    ALIPAY_PRIVATE_KEY_PATH: str = "private_key-PATH"   # 或存储为字符串
    ALIPAY_PUBLIC_KEY_PATH: str = "public_key-PATH"
    ALIPAY_GATEWAY: str = "https://openapi-sandbox.dl.alipaydev.com/gateway.do"  # 沙箱网关
    ALIPAY_NOTIFY_URL: str = "https://your-domain.com/api/v1/payment/alipay/notify"
    ALIPAY_RETURN_URL: str = "https://your-domain.com/payment-return"
    VERIFY_SIGN: bool = True  # 验签开关（测试时可关闭）        

    # 关闭SQL日志
    DB_ECHO: bool = False 

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra="ignore" 

settings = Settings()