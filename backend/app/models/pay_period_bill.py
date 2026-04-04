from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import Base

if TYPE_CHECKING:
    from app.models.bill_template import BillTemplate
    from app.models.pay_period import PayPeriod


class PayPeriodBill(Base):
    __tablename__ = "pay_period_bills"

    id: Mapped[int] = mapped_column(primary_key=True)
    pay_period_id: Mapped[int] = mapped_column(
        ForeignKey("pay_periods.id", ondelete="CASCADE"), nullable=False
    )
    bill_template_id: Mapped[int | None] = mapped_column(
        ForeignKey("bill_templates.id", ondelete="SET NULL")
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    paid_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    pay_period: Mapped["PayPeriod"] = relationship(back_populates="bills")
    bill_template: Mapped["BillTemplate | None"] = relationship(
        back_populates="pay_period_bills"
    )

    def __repr__(self) -> str:
        return f"<PayPeriodBill {self.name} ${self.amount}>"
