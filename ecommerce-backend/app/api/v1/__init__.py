# app/api/v1/__init__.py
from fastapi import APIRouter
from app.api.v1 import auth, products, admin_products, cart, orders, admin_orders, admin_users, admin_carts, admin_stats
from app.api.v1 import payment
# 创建主路由
api_router = APIRouter()

# 注册子路由
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(admin_products.router, prefix="/admin/products", tags=["admin-products"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])   # 新增
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(admin_orders.router, prefix="/admin/orders", tags=["admin-orders"])
api_router.include_router(admin_users.router, prefix="/admin/users", tags=["admin-users"])
api_router.include_router(admin_carts.router, prefix="/admin/carts", tags=["admin-carts"])
api_router.include_router(admin_stats.router, prefix="/admin", tags=["admin-stats"])
api_router.include_router(payment.router, prefix="/payment", tags=["payment"])