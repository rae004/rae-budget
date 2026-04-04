from datetime import date
from decimal import Decimal

from app.models import SpendingEntry


class TestSpendingEntryModel:
    """Tests for SpendingEntry model."""

    def test_create_spending_entry(self, session, sample_pay_period):
        """Can create a spending entry."""
        entry = SpendingEntry(
            pay_period_id=sample_pay_period.id,
            description="Coffee at Starbucks",
            amount=Decimal("5.50"),
            spent_date=date(2026, 4, 7),
        )
        session.add(entry)
        session.commit()

        assert entry.id is not None
        assert entry.description == "Coffee at Starbucks"
        assert entry.amount == Decimal("5.50")

    def test_spending_entry_with_category(
        self, session, sample_pay_period, sample_category
    ):
        """Can create spending entry with category."""
        entry = SpendingEntry(
            pay_period_id=sample_pay_period.id,
            category_id=sample_category.id,
            description="Dinner",
            amount=Decimal("45.00"),
            spent_date=date(2026, 4, 8),
        )
        session.add(entry)
        session.commit()

        session.refresh(entry)
        assert entry.category.name == "Food"

    def test_spending_entry_with_notes(self, session, sample_pay_period):
        """Can create spending entry with notes."""
        entry = SpendingEntry(
            pay_period_id=sample_pay_period.id,
            description="Gas",
            amount=Decimal("50.00"),
            spent_date=date(2026, 4, 9),
            notes="Shell station",
        )
        session.add(entry)
        session.commit()

        assert entry.notes == "Shell station"

    def test_spending_entry_relationship(
        self, sample_spending, sample_pay_period, session
    ):
        """Spending entry has relationship to pay period."""
        session.refresh(sample_spending)
        assert sample_spending.pay_period.id == sample_pay_period.id

    def test_spending_entry_repr(self, sample_spending):
        """Spending entry has readable repr."""
        assert "Groceries" in repr(sample_spending)
        assert "150" in repr(sample_spending)
