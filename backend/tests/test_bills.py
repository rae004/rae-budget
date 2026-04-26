import json
from datetime import date
from decimal import Decimal

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

    def test_pay_period_bill_relationship(
        self, sample_bill, sample_pay_period, session
    ):
        """Bill has relationship to pay period."""
        session.refresh(sample_bill)
        assert sample_bill.pay_period.id == sample_pay_period.id

    def test_pay_period_bill_repr(self, sample_bill):
        """Pay period bill has readable repr."""
        assert "Rent" in repr(sample_bill)
        assert "1500" in repr(sample_bill)


class TestListBills:
    """GET /api/pay-periods/:id/bills"""

    def test_empty_for_new_pay_period(self, client, sample_pay_period):
        pp_id = sample_pay_period.id
        response = client.get(f"/api/pay-periods/{pp_id}/bills")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_returns_bills(self, client, sample_pay_period, sample_bill):
        pp_id = sample_pay_period.id
        response = client.get(f"/api/pay-periods/{pp_id}/bills")
        body = response.get_json()
        assert len(body) == 1
        assert body[0]["name"] == "Rent"

    def test_pay_period_not_found(self, client, session):
        response = client.get("/api/pay-periods/9999/bills")
        assert response.status_code == 404


class TestListAllBills:
    """GET /api/bills — unfiltered list across pay periods."""

    def test_empty(self, client, session):
        response = client.get("/api/bills")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_returns_bills_from_multiple_pay_periods(
        self, client, session, sample_pay_period, sample_bill
    ):
        # Add a second pay period with its own bill
        from app.models import PayPeriod

        other_pp = PayPeriod(
            start_date=date(2026, 4, 20),
            end_date=date(2026, 5, 5),
            expected_income=Decimal("2500.00"),
        )
        session.add(other_pp)
        session.commit()
        session.add(
            PayPeriodBill(
                pay_period_id=other_pp.id,
                name="Internet",
                amount=Decimal("80.00"),
                due_date=date(2026, 4, 22),
            )
        )
        session.commit()

        response = client.get("/api/bills")
        body = response.get_json()
        assert len(body) == 2
        names = sorted(b["name"] for b in body)
        assert names == ["Internet", "Rent"]


class TestCreateBill:
    """POST /api/pay-periods/:id/bills"""

    def test_create_minimal(self, client, sample_pay_period):
        pp_id = sample_pay_period.id
        response = client.post(
            f"/api/pay-periods/{pp_id}/bills",
            data=json.dumps({"name": "Internet", "amount": 75}),
            content_type="application/json",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["name"] == "Internet"
        assert body["pay_period_id"] == pp_id
        assert body["is_paid"] is False

    def test_create_with_template_link(
        self, client, sample_pay_period, sample_bill_template
    ):
        pp_id = sample_pay_period.id
        template_id = sample_bill_template.id
        response = client.post(
            f"/api/pay-periods/{pp_id}/bills",
            data=json.dumps(
                {
                    "name": "Rent",
                    "amount": 1500,
                    "bill_template_id": template_id,
                    "due_date": "2026-04-01",
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert response.get_json()["bill_template_id"] == template_id

    def test_create_validation_error(self, client, sample_pay_period):
        pp_id = sample_pay_period.id
        response = client.post(
            f"/api/pay-periods/{pp_id}/bills",
            data=json.dumps({"amount": 100}),  # missing name
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_create_pay_period_not_found(self, client, session):
        response = client.post(
            "/api/pay-periods/9999/bills",
            data=json.dumps({"name": "x", "amount": 1}),
            content_type="application/json",
        )
        assert response.status_code == 404


class TestUpdateBill:
    """PUT /api/bills/:id"""

    def test_update_amount(self, client, sample_bill):
        bill_id = sample_bill.id
        response = client.put(
            f"/api/bills/{bill_id}",
            data=json.dumps({"amount": 1600}),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.get_json()["amount"] == "1600.00"

    def test_mark_paid(self, client, sample_bill):
        bill_id = sample_bill.id
        response = client.put(
            f"/api/bills/{bill_id}",
            data=json.dumps({"is_paid": True, "paid_date": "2026-04-02"}),
            content_type="application/json",
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["is_paid"] is True
        assert body["paid_date"] == "2026-04-02"

    def test_validation_error(self, client, sample_bill):
        bill_id = sample_bill.id
        response = client.put(
            f"/api/bills/{bill_id}",
            data=json.dumps({"amount": -1}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_not_found(self, client, session):
        response = client.put(
            "/api/bills/9999",
            data=json.dumps({"name": "x"}),
            content_type="application/json",
        )
        assert response.status_code == 404


class TestDeleteBill:
    """DELETE /api/bills/:id"""

    def test_delete(self, client, session, sample_bill):
        bill_id = sample_bill.id
        response = client.delete(f"/api/bills/{bill_id}")
        assert response.status_code == 204
        assert session.query(PayPeriodBill).filter_by(id=bill_id).first() is None

    def test_not_found(self, client, session):
        response = client.delete("/api/bills/9999")
        assert response.status_code == 404
