from datetime import date
from decimal import Decimal

from app.services import (
    adjust_for_weekend,
    get_next_pay_date,
    get_pay_period_end_date,
)


class TestPayDateCalculations:
    """Tests for pay date calculations."""

    def test_get_next_pay_date_before_6th(self):
        """If before 6th, next pay is the 6th."""
        result = get_next_pay_date(date(2026, 4, 3))
        assert result == date(2026, 4, 6)

    def test_get_next_pay_date_on_6th(self):
        """If on 6th, next pay is still the 6th (same day)."""
        result = get_next_pay_date(date(2026, 4, 6))
        assert result == date(2026, 4, 20)

    def test_get_next_pay_date_between_6th_and_20th(self):
        """If between 6th and 20th, next pay is the 20th."""
        result = get_next_pay_date(date(2026, 4, 10))
        assert result == date(2026, 4, 20)

    def test_get_next_pay_date_after_20th(self):
        """If after 20th, next pay is 6th of next month."""
        result = get_next_pay_date(date(2026, 4, 25))
        assert result == date(2026, 5, 6)

    def test_get_next_pay_date_december_to_january(self):
        """If after 20th in December, next pay is Jan 6th."""
        result = get_next_pay_date(date(2026, 12, 25))
        assert result == date(2027, 1, 6)

    def test_adjust_for_weekend_saturday(self):
        """Saturday moves to Friday."""
        # April 4, 2026 is a Saturday
        result = adjust_for_weekend(date(2026, 4, 4))
        assert result == date(2026, 4, 3)

    def test_adjust_for_weekend_sunday(self):
        """Sunday moves to Friday."""
        # April 5, 2026 is a Sunday
        result = adjust_for_weekend(date(2026, 4, 5))
        assert result == date(2026, 4, 3)

    def test_adjust_for_weekend_weekday(self):
        """Weekday stays the same."""
        # April 6, 2026 is a Monday
        result = adjust_for_weekend(date(2026, 4, 6))
        assert result == date(2026, 4, 6)

    def test_get_pay_period_end_date_from_6th(self):
        """End date from 6th is day before 20th."""
        result = get_pay_period_end_date(date(2026, 4, 6))
        # April 20, 2026 is a Monday, so no adjustment
        # End date is April 19
        assert result == date(2026, 4, 19)

    def test_get_pay_period_end_date_from_20th(self):
        """End date from 20th is day before next 6th."""
        result = get_pay_period_end_date(date(2026, 4, 20))
        # May 6, 2026 is a Wednesday, so no adjustment
        # End date is May 5
        assert result == date(2026, 5, 5)


class TestPayPeriodCalculations:
    """Tests for pay period calculations."""

    def test_bill_total(self, sample_pay_period, sample_bill, session):
        """Bill total sums all bills."""
        session.refresh(sample_pay_period)
        assert sample_pay_period.bill_total == Decimal("1500.00")

    def test_spending_total(self, sample_pay_period, sample_spending, session):
        """Spending total sums all spending entries."""
        session.refresh(sample_pay_period)
        assert sample_pay_period.spending_total == Decimal("150.00")

    def test_running_total(
        self, sample_pay_period, sample_bill, sample_spending, session
    ):
        """Running total is bills + spending."""
        session.refresh(sample_pay_period)
        assert sample_pay_period.running_total == Decimal("1650.00")

    def test_remaining_with_expected_income(
        self, sample_pay_period, sample_bill, sample_spending, session
    ):
        """Remaining uses expected income if no actual income."""
        session.refresh(sample_pay_period)
        # 2500 - 1650 = 850
        assert sample_pay_period.remaining == Decimal("850.00")

    def test_remaining_with_actual_income(
        self, sample_pay_period, sample_bill, sample_spending, session
    ):
        """Remaining uses actual income when set."""
        sample_pay_period.actual_income = Decimal("2600.00")
        session.commit()
        session.refresh(sample_pay_period)
        # 2600 - 1650 = 950
        assert sample_pay_period.remaining == Decimal("950.00")
