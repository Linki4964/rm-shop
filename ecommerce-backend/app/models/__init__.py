# app/models/__init__.py
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.coupon import Coupon
from app.models.address import UserAddress
from app.models.favorite import Favorite

__all__ = ["User", "Product", "CartItem", "Order", "OrderItem", "Coupon", "UserAddress", "Favorite"]