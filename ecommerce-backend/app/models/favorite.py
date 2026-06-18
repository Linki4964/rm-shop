# app/models/favorite.py
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.database import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="favorites")
    product: Mapped["Product"] = relationship("Product", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_user_product_favorite"),
    )
