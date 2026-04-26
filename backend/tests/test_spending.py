import json
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


class TestListSpending:
    """GET /api/pay-periods/:id/spending"""

    def test_empty_for_new_pay_period(self, client, sample_pay_period):
        pp_id = sample_pay_period.id
        response = client.get(f"/api/pay-periods/{pp_id}/spending")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_returns_entries(self, client, sample_pay_period, sample_spending):
        pp_id = sample_pay_period.id
        response = client.get(f"/api/pay-periods/{pp_id}/spending")
        body = response.get_json()
        assert len(body) == 1
        assert body[0]["description"] == "Groceries at Publix"

    def test_pay_period_not_found(self, client, session):
        response = client.get("/api/pay-periods/9999/spending")
        assert response.status_code == 404


class TestCreateSpending:
    """POST /api/pay-periods/:id/spending"""

    def test_create_minimal(self, client, sample_pay_period):
        pp_id = sample_pay_period.id
        response = client.post(
            f"/api/pay-periods/{pp_id}/spending",
            data=json.dumps(
                {
                    "description": "Coffee",
                    "amount": 4.50,
                    "spent_date": "2026-04-08",
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["description"] == "Coffee"
        assert body["pay_period_id"] == pp_id

    def test_create_with_category(self, client, sample_pay_period, sample_category):
        pp_id = sample_pay_period.id
        cat_id = sample_category.id
        response = client.post(
            f"/api/pay-periods/{pp_id}/spending",
            data=json.dumps(
                {
                    "description": "Lunch",
                    "amount": 12,
                    "spent_date": "2026-04-10",
                    "category_id": cat_id,
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert response.get_json()["category_id"] == cat_id

    def test_create_validation_error(self, client, sample_pay_period):
        pp_id = sample_pay_period.id
        response = client.post(
            f"/api/pay-periods/{pp_id}/spending",
            data=json.dumps({"amount": 5}),  # missing description, spent_date
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_create_pay_period_not_found(self, client, session):
        response = client.post(
            "/api/pay-periods/9999/spending",
            data=json.dumps(
                {
                    "description": "x",
                    "amount": 1,
                    "spent_date": "2026-04-10",
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 404


class TestUpdateSpending:
    """PUT /api/spending/:id"""

    def test_update_amount(self, client, sample_spending):
        entry_id = sample_spending.id
        response = client.put(
            f"/api/spending/{entry_id}",
            data=json.dumps({"amount": 175}),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.get_json()["amount"] == "175.00"

    def test_partial_update(self, client, sample_spending):
        entry_id = sample_spending.id
        original_desc = sample_spending.description
        response = client.put(
            f"/api/spending/{entry_id}",
            data=json.dumps({"notes": "added a note"}),
            content_type="application/json",
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["notes"] == "added a note"
        assert body["description"] == original_desc

    def test_validation_error(self, client, sample_spending):
        entry_id = sample_spending.id
        response = client.put(
            f"/api/spending/{entry_id}",
            data=json.dumps({"amount": -1}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_not_found(self, client, session):
        response = client.put(
            "/api/spending/9999",
            data=json.dumps({"description": "x"}),
            content_type="application/json",
        )
        assert response.status_code == 404


class TestDeleteSpending:
    """DELETE /api/spending/:id"""

    def test_delete(self, client, session, sample_spending):
        entry_id = sample_spending.id
        response = client.delete(f"/api/spending/{entry_id}")
        assert response.status_code == 204
        assert session.query(SpendingEntry).filter_by(id=entry_id).first() is None

    def test_not_found(self, client, session):
        response = client.delete("/api/spending/9999")
        assert response.status_code == 404
