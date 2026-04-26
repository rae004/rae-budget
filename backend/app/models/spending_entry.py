from datetime import UTC, date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.pay_period import PayPeriod


class SpendingEntry(Base):
    __tablename__ = "spending_entries"
    __table_args__ = (
        Index("idx_spending_entries_pay_period", "pay_period_id"),
        Index("idx_spending_entries_category", "category_id"),
        Index("idx_spending_entries_date", "spent_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    pay_period_id: Mapped[int] = mapped_column(
        ForeignKey("pay_periods.id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL")
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    spent_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    pay_period: Mapped["PayPeriod"] = relationship(back_populates="spending_entries")
    category: Mapped["Category | None"] = relationship(
        back_populates="spending_entries"
    )

    def __repr__(self) -> str:
        return f"<SpendingEntry {self.description} ${self.amount}>"
