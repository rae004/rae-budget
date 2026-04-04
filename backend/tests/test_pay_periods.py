from datetime import date
from decimal import Decimal

from app.models import PayPeriod


class TestPayPeriodModel:
    """Tests for PayPeriod model."""

    def test_create_pay_period(self, session):
        """Can create a pay period."""
        pay_period = PayPeriod(
            start_date=date(2026, 4, 6),
            end_date=date(2026, 4, 19),
            expected_income=Decimal("2500.00"),
        )
        session.add(pay_period)
        session.commit()

        assert pay_period.id is not None
        assert pay_period.start_date == date(2026, 4, 6)
        assert pay_period.end_date == date(2026, 4, 19)
        assert pay_period.expected_income == Decimal("2500.00")

    def test_pay_period_defaults(self, session):
        """Pay period has correct defaults."""
        pay_period = PayPeriod(
            start_date=date(2026, 4, 6),
            end_date=date(2026, 4, 19),
            expected_income=Decimal("0"),
        )
        session.add(pay_period)
        session.commit()

        assert pay_period.actual_income is None
        assert pay_period.notes is None
        assert pay_period.created_at is not None
        assert pay_period.updated_at is not None

    def test_pay_period_with_notes(self, session):
        """Can create pay period with notes."""
        pay_period = PayPeriod(
            start_date=date(2026, 4, 6),
            end_date=date(2026, 4, 19),
            expected_income=Decimal("2500.00"),
            notes="Bonus month",
        )
        session.add(pay_period)
        session.commit()

        assert pay_period.notes == "Bonus month"

    def test_pay_period_repr(self, sample_pay_period):
        """Pay period has readable repr."""
        assert "2026-04-06" in repr(sample_pay_period)
        assert "2026-04-19" in repr(sample_pay_period)
