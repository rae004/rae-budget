from datetime import date
from decimal import Decimal

import pytest

from app.models import BillTemplate, PayPeriodBill


class TestBillTemplateModel:
    """Tests for BillTemplate model."""

    def test_create_bill_template(self, session):
        """Can create a bill template."""
        template = BillTemplate(
            name="Electric",
            default_amount=Decimal("150.00"),
            due_day_of_month=15,
            is_recurring=True,
        )
        session.add(template)
        session.commit()

        assert template.id is not None
        assert template.name == "Electric"
        assert template.default_amount == Decimal("150.00")
        assert template.due_day_of_month == 15

    def test_bill_template_defaults(self, session):
        """Bill template has correct defaults."""
        template = BillTemplate(
            name="Test Bill",
            default_amount=Decimal("100.00"),
        )
        session.add(template)
        session.commit()

        assert template.is_recurring is True
        assert template.notes is None

    def test_bill_template_repr(self, sample_bill_template):
        """Bill template has readable repr."""
        assert "Rent" in repr(sample_bill_template)


class TestPayPeriodBillModel:
    """Tests for PayPeriodBill model."""

    def test_create_pay_period_bill(self, session, sample_pay_period):
        """Can create a pay period bill."""
        bill = PayPeriodBill(
            pay_period_id=sample_pay_period.id,
            name="Internet",
            amount=Decimal("75.00"),
            due_date=date(2026, 4, 10),
        )
        session.add(bill)
        session.commit()

        assert bill.id is not None
        assert bill.name == "Internet"
        assert bill.amount == Decimal("75.00")

    def test_pay_period_bill_defaults(self, session, sample_pay_period):
        """Pay period bill has correct defaults."""
        bill = PayPeriodBill(
            pay_period_id=sample_pay_period.id,
            name="Test Bill",
            amount=Decimal("50.00"),
        )
        session.add(bill)
        session.commit()

        assert bill.is_paid is False
        assert bill.paid_date is None

    def test_pay_period_bill_mark_paid(self, session, sample_bill):
        """Can mark a bill as paid."""
        sample_bill.is_paid = True
        sample_bill.paid_date = date(2026, 4, 1)
        session.commit()

        assert sample_bill.is_paid is True
        assert sample_bill.paid_date == date(2026, 4, 1)

    def test_pay_period_bill_relationship(self, sample_bill, sample_pay_period, session):
        """Bill has relationship to pay period."""
        session.refresh(sample_bill)
        assert sample_bill.pay_period.id == sample_pay_period.id

    def test_pay_period_bill_repr(self, sample_bill):
        """Pay period bill has readable repr."""
        assert "Rent" in repr(sample_bill)
        assert "1500" in repr(sample_bill)
