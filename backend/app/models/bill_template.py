from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import Base

if TYPE_CHECKING:
    from app.models.pay_period_bill import PayPeriodBill


class BillTemplate(Base):
    __tablename__ = "bill_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    default_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    due_day_of_month: Mapped[int | None] = mapped_column(Integer)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL")
    )
    notes: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    pay_period_bills: Mapped[list["PayPeriodBill"]] = relationship(
        back_populates="bill_template"
    )

    def __repr__(self) -> str:
        return f"<BillTemplate {self.name}>"
