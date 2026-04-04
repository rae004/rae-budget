from datetime import UTC, date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import Base

if TYPE_CHECKING:
    from app.models.pay_period_bill import PayPeriodBill
    from app.models.spending_entry import SpendingEntry


class PayPeriod(Base):
    __tablename__ = "pay_periods"

    id: Mapped[int] = mapped_column(primary_key=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_income: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0")
    )
    actual_income: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    bills: Mapped[list["PayPeriodBill"]] = relationship(
        back_populates="pay_period", cascade="all, delete-orphan"
    )
    spending_entries: Mapped[list["SpendingEntry"]] = relationship(
        back_populates="pay_period", cascade="all, delete-orphan"
    )

    @property
    def bill_total(self) -> Decimal:
        """Sum of all bills for this pay period."""
        return sum((bill.amount for bill in self.bills), Decimal("0"))

    @property
    def spending_total(self) -> Decimal:
        """Sum of all spending entries for this pay period."""
        return sum((entry.amount for entry in self.spending_entries), Decimal("0"))

    @property
    def running_total(self) -> Decimal:
        """Total of bills + spending."""
        return self.bill_total + self.spending_total

    @property
    def remaining(self) -> Decimal:
        """Remaining balance (income - running total)."""
        income = self.actual_income or self.expected_income
        return income - self.running_total

    def __repr__(self) -> str:
        return f"<PayPeriod {self.start_date} - {self.end_date}>"
