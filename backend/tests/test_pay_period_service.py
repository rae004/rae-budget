"""Tests for pay period service functions, specifically bill due date calculation."""

from datetime import date
from decimal import Decimal

import pytest

from app.models import BillTemplate, PayPeriod
from app.services import calculate_bill_due_date, create_bills_from_templates


class TestCalculateBillDueDate:
    """Tests for calculate_bill_due_date function."""

    def test_bill_due_date_in_first_pay_period(self):
        """Bill due on 1st should only appear in pay period containing the 1st."""
        # Pay period: Apr 1-5
        # Bill due: 1st
        # Expected: Due date Apr 1
        due_date = calculate_bill_due_date(
            due_day=1,
            period_start=date(2026, 4, 1),
            period_end=date(2026, 4, 5),
        )
        assert due_date == date(2026, 4, 1)

    def test_bill_due_date_in_second_pay_period(self):
        """Bill due on 15th should only appear in pay period containing the 15th."""
        # Pay period: Apr 6-19
        # Bill due: 15th
        # Expected: Due date Apr 15
        due_date = calculate_bill_due_date(
            due_day=15,
            period_start=date(2026, 4, 6),
            period_end=date(2026, 4, 19),
        )
        assert due_date == date(2026, 4, 15)

    def test_bill_due_date_not_in_pay_period(self):
        """Bill due on 25th should not appear in pay period Apr 6-19."""
        # Pay period: Apr 6-19
        # Bill due: 25th
        # Expected: None (not in this pay period)
        due_date = calculate_bill_due_date(
            due_day=25,
            period_start=date(2026, 4, 6),
            period_end=date(2026, 4, 19),
        )
        assert due_date is None

    def test_bill_due_date_spanning_months_start_month(self):
        """Pay period spanning months should include bills from start month."""
        # Pay period: Dec 20 - Jan 5
        # Bill due: 25th
        # Expected: Dec 25
        due_date = calculate_bill_due_date(
            due_day=25,
            period_start=date(2026, 12, 20),
            period_end=date(2027, 1, 5),
        )
        assert due_date == date(2026, 12, 25)

    def test_bill_due_date_spanning_months_end_month(self):
        """Pay period spanning months should include bills from end month."""
        # Pay period: Dec 20 - Jan 5
        # Bill due: 1st
        # Expected: Jan 1
        due_date = calculate_bill_due_date(
            due_day=1,
            period_start=date(2026, 12, 20),
            period_end=date(2027, 1, 5),
        )
        assert due_date == date(2027, 1, 1)

    def test_bill_due_date_short_month_february(self):
        """Bills due on 31st should adjust for February (28 days)."""
        # Pay period: Feb 20 - Mar 5 (non-leap year)
        # Bill due: 31st
        # Expected: Feb 28 (adjusted to last day of Feb)
        due_date = calculate_bill_due_date(
            due_day=31,
            period_start=date(2026, 2, 20),
            period_end=date(2026, 3, 5),
        )
        assert due_date == date(2026, 2, 28)

    def test_bill_due_date_short_month_february_leap_year(self):
        """Bills due on 30th should adjust for February in leap year."""
        # Pay period: Feb 20 - Mar 5 (leap year 2028)
        # Bill due: 30th
        # Expected: Feb 29 (adjusted to last day of Feb in leap year)
        due_date = calculate_bill_due_date(
            due_day=30,
            period_start=date(2028, 2, 20),
            period_end=date(2028, 3, 5),
        )
        assert due_date == date(2028, 2, 29)

    def test_bill_due_date_on_period_start_boundary(self):
        """Bill due on same day as period start should be included."""
        # Pay period: Apr 6-19
        # Bill due: 6th
        # Expected: Apr 6 (inclusive start boundary)
        due_date = calculate_bill_due_date(
            due_day=6,
            period_start=date(2026, 4, 6),
            period_end=date(2026, 4, 19),
        )
        assert due_date == date(2026, 4, 6)

    def test_bill_due_date_on_period_end_boundary(self):
        """Bill due on same day as period end should be included."""
        # Pay period: Apr 6-19
        # Bill due: 19th
        # Expected: Apr 19 (inclusive end boundary)
        due_date = calculate_bill_due_date(
            due_day=19,
            period_start=date(2026, 4, 6),
            period_end=date(2026, 4, 19),
        )
        assert due_date == date(2026, 4, 19)

    def test_bill_due_date_30th_in_short_month(self):
        """Bills due on 30th should adjust for months with 30 days."""
        # Pay period: Apr 20 - May 5
        # Bill due: 30th
        # Expected: Apr 30 (April has 30 days)
        due_date = calculate_bill_due_date(
            due_day=30,
            period_start=date(2026, 4, 20),
            period_end=date(2026, 5, 5),
        )
        assert due_date == date(2026, 4, 30)

    def test_bill_due_date_31st_in_30_day_month(self):
        """Bills due on 31st should adjust to 30th for 30-day months."""
        # Pay period: Apr 20 - May 5
        # Bill due: 31st
        # Expected: Apr 30 (adjusted to last day of April)
        due_date = calculate_bill_due_date(
            due_day=31,
            period_start=date(2026, 4, 20),
            period_end=date(2026, 5, 5),
        )
        assert due_date == date(2026, 4, 30)


class TestCreateBillsFromTemplates:
    """Tests for create_bills_from_templates function."""

    def test_creates_bill_when_due_date_in_period(self, session):
        """Should create bill when due date falls within pay period."""
        # Create a bill template due on the 15th
        template = BillTemplate(
            name="Internet",
            default_amount=Decimal("100.00"),
            due_day_of_month=15,
            is_recurring=True,
        )
        session.add(template)
        session.commit()

        # Create pay period Apr 6-19 (includes 15th)
        pay_period = PayPeriod(
            start_date=date(2026, 4, 6),
            end_date=date(2026, 4, 19),
            expected_income=Decimal("2500.00"),
        )
        session.add(pay_period)
        session.commit()

        # Create bills from templates
        bills = create_bills_from_templates(session, pay_period)

        assert len(bills) == 1
        assert bills[0].name == "Internet"
        assert bills[0].due_date == date(2026, 4, 15)

    def test_does_not_create_bill_when_due_date_outside_period(self, session):
        """Should not create bill when due date falls outside pay period."""
        # Create a bill template due on the 25th
        template = BillTemplate(
            name="Rent",
            default_amount=Decimal("1500.00"),
            due_day_of_month=25,
            is_recurring=True,
        )
        session.add(template)
        session.commit()

        # Create pay period Apr 6-19 (does not include 25th)
        pay_period = PayPeriod(
            start_date=date(2026, 4, 6),
            end_date=date(2026, 4, 19),
            expected_income=Decimal("2500.00"),
        )
        session.add(pay_period)
        session.commit()

        # Create bills from templates
        bills = create_bills_from_templates(session, pay_period)

        assert len(bills) == 0

    def test_creates_multiple_bills_in_period(self, session):
        """Should create multiple bills when multiple templates have due dates in period."""
        # Create templates due on 8th and 15th
        template1 = BillTemplate(
            name="Phone",
            default_amount=Decimal("80.00"),
            due_day_of_month=8,
            is_recurring=True,
        )
        template2 = BillTemplate(
            name="Internet",
            default_amount=Decimal("100.00"),
            due_day_of_month=15,
            is_recurring=True,
        )
        session.add_all([template1, template2])
        session.commit()

        # Create pay period Apr 6-19
        pay_period = PayPeriod(
            start_date=date(2026, 4, 6),
            end_date=date(2026, 4, 19),
            expected_income=Decimal("2500.00"),
        )
        session.add(pay_period)
        session.commit()

        # Create bills from templates
        bills = create_bills_from_templates(session, pay_period)

        assert len(bills) == 2
        bill_names = {b.name for b in bills}
        assert bill_names == {"Phone", "Internet"}

    def test_filters_mixed_due_dates(self, session):
        """Should only create bills for templates with due dates in period."""
        # Create templates: one in period (10th), one outside (25th)
        template_in = BillTemplate(
            name="In Period",
            default_amount=Decimal("50.00"),
            due_day_of_month=10,
            is_recurring=True,
        )
        template_out = BillTemplate(
            name="Out of Period",
            default_amount=Decimal("75.00"),
            due_day_of_month=25,
            is_recurring=True,
        )
        session.add_all([template_in, template_out])
        session.commit()

        # Create pay period Apr 6-19
        pay_period = PayPeriod(
            start_date=date(2026, 4, 6),
            end_date=date(2026, 4, 19),
            expected_income=Decimal("2500.00"),
        )
        session.add(pay_period)
        session.commit()

        # Create bills from templates
        bills = create_bills_from_templates(session, pay_period)

        assert len(bills) == 1
        assert bills[0].name == "In Period"

    def test_skips_non_recurring_templates(self, session):
        """Should not create bills for non-recurring templates."""
        # Create a non-recurring template
        template = BillTemplate(
            name="One-time Bill",
            default_amount=Decimal("200.00"),
            due_day_of_month=10,
            is_recurring=False,
        )
        session.add(template)
        session.commit()

        # Create pay period Apr 6-19
        pay_period = PayPeriod(
            start_date=date(2026, 4, 6),
            end_date=date(2026, 4, 19),
            expected_income=Decimal("2500.00"),
        )
        session.add(pay_period)
        session.commit()

        # Create bills from templates
        bills = create_bills_from_templates(session, pay_period)

        assert len(bills) == 0

    def test_skips_templates_without_due_day(self, session):
        """Should skip templates that don't have a due_day_of_month set."""
        # Create a template without due day
        template = BillTemplate(
            name="No Due Day",
            default_amount=Decimal("100.00"),
            due_day_of_month=None,
            is_recurring=True,
        )
        session.add(template)
        session.commit()

        # Create pay period Apr 6-19
        pay_period = PayPeriod(
            start_date=date(2026, 4, 6),
            end_date=date(2026, 4, 19),
            expected_income=Decimal("2500.00"),
        )
        session.add(pay_period)
        session.commit()

        # Create bills from templates
        bills = create_bills_from_templates(session, pay_period)

        assert len(bills) == 0

    def test_handles_month_spanning_period(self, session):
        """Should correctly handle pay periods that span two months."""
        # Create templates: one due 25th (Dec), one due 1st (Jan)
        template_dec = BillTemplate(
            name="December Bill",
            default_amount=Decimal("100.00"),
            due_day_of_month=25,
            is_recurring=True,
        )
        template_jan = BillTemplate(
            name="January Bill",
            default_amount=Decimal("150.00"),
            due_day_of_month=1,
            is_recurring=True,
        )
        session.add_all([template_dec, template_jan])
        session.commit()

        # Create pay period Dec 20 - Jan 5
        pay_period = PayPeriod(
            start_date=date(2026, 12, 20),
            end_date=date(2027, 1, 5),
            expected_income=Decimal("2500.00"),
        )
        session.add(pay_period)
        session.commit()

        # Create bills from templates
        bills = create_bills_from_templates(session, pay_period)

        assert len(bills) == 2
        bill_by_name = {b.name: b for b in bills}
        assert bill_by_name["December Bill"].due_date == date(2026, 12, 25)
        assert bill_by_name["January Bill"].due_date == date(2027, 1, 1)
