import json
from datetime import date, timedelta
from decimal import Decimal

from app.models import PayPeriod, SpendingEntry


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


class TestListAllSpending:
    """GET /api/spending — unfiltered list across pay periods."""

    def test_empty(self, client, session):
        response = client.get("/api/spending")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_returns_entries_from_multiple_pay_periods(
        self, client, session, sample_pay_period, sample_spending
    ):
        from app.models import PayPeriod, SpendingEntry

        other_pp = PayPeriod(
            start_date=date(2026, 4, 20),
            end_date=date(2026, 5, 5),
            expected_income=Decimal("2500.00"),
        )
        session.add(other_pp)
        session.commit()
        session.add(
            SpendingEntry(
                pay_period_id=other_pp.id,
                description="Coffee",
                amount=Decimal("5.00"),
                spent_date=date(2026, 4, 22),
            )
        )
        session.commit()

        response = client.get("/api/spending")
        body = response.get_json()
        assert len(body) == 2
        descriptions = sorted(e["description"] for e in body)
        assert descriptions == ["Coffee", "Groceries at Publix"]


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


class TestSpendingDescriptionSuggestions:
    """GET /api/spending/description-suggestions"""

    @staticmethod
    def _make_entry(session, pp_id, description, days_ago, category_id=None):
        entry = SpendingEntry(
            pay_period_id=pp_id,
            description=description,
            amount=Decimal("1.00"),
            spent_date=date.today() - timedelta(days=days_ago),
            category_id=category_id,
        )
        session.add(entry)
        session.commit()
        return entry

    def _setup_pp(self, session):
        pp = PayPeriod(
            start_date=date.today() - timedelta(days=120),
            end_date=date.today() + timedelta(days=30),
            expected_income=Decimal("2500.00"),
        )
        session.add(pp)
        session.commit()
        return pp

    def test_empty_q_returns_empty_list(self, client, session):
        response = client.get("/api/spending/description-suggestions")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_blank_q_returns_empty_list(self, client, session):
        response = client.get("/api/spending/description-suggestions?q=%20%20")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_starts_with_match_case_insensitive(self, client, session):
        pp = self._setup_pp(session)
        self._make_entry(session, pp.id, "Lunch", 1)
        self._make_entry(session, pp.id, "latte", 2)
        self._make_entry(session, pp.id, "Coffee", 3)

        response = client.get("/api/spending/description-suggestions?q=L")
        body = response.get_json()
        descriptions = {row["description"] for row in body}
        assert descriptions == {"Lunch", "latte"}

    def test_does_not_match_mid_string(self, client, session):
        pp = self._setup_pp(session)
        self._make_entry(session, pp.id, "Coffee", 1)
        self._make_entry(session, pp.id, "ice cream", 2)

        response = client.get("/api/spending/description-suggestions?q=cream")
        assert response.get_json() == []

    def test_ordered_by_frequency_desc(self, client, session):
        pp = self._setup_pp(session)
        for _ in range(3):
            self._make_entry(session, pp.id, "Lunch", 1)
        for _ in range(5):
            self._make_entry(session, pp.id, "Latte", 1)
        self._make_entry(session, pp.id, "Lyft", 1)

        response = client.get("/api/spending/description-suggestions?q=L")
        body = response.get_json()
        assert [row["description"] for row in body] == ["Latte", "Lunch", "Lyft"]
        assert body[0]["frequency"] == 5
        assert body[1]["frequency"] == 3
        assert body[2]["frequency"] == 1

    def test_excludes_entries_outside_window(self, client, session):
        pp = self._setup_pp(session)
        self._make_entry(session, pp.id, "Lunch", 10)
        self._make_entry(session, pp.id, "Lunch", 200)  # outside default 90d
        self._make_entry(session, pp.id, "Latte", 100)  # outside default 90d

        response = client.get("/api/spending/description-suggestions?q=L")
        body = response.get_json()
        assert len(body) == 1
        assert body[0]["description"] == "Lunch"
        assert body[0]["frequency"] == 1

    def test_custom_days_param(self, client, session):
        pp = self._setup_pp(session)
        self._make_entry(session, pp.id, "Lunch", 20)
        self._make_entry(session, pp.id, "Lunch", 200)

        response = client.get("/api/spending/description-suggestions?q=L&days=10")
        assert response.get_json() == []

        response = client.get("/api/spending/description-suggestions?q=L&days=365")
        body = response.get_json()
        assert body[0]["frequency"] == 2

    def test_limit_param(self, client, session):
        pp = self._setup_pp(session)
        for name in ["Latte", "Lunch", "Lyft", "Loan"]:
            self._make_entry(session, pp.id, name, 1)

        response = client.get("/api/spending/description-suggestions?q=L&limit=2")
        body = response.get_json()
        assert len(body) == 2

    def test_last_category_id_returns_most_recent(
        self, client, session, sample_category
    ):
        pp = self._setup_pp(session)
        cat_id = sample_category.id
        # Older entry has category; newer has no category — newer wins.
        self._make_entry(session, pp.id, "Lunch", 30, category_id=cat_id)
        self._make_entry(session, pp.id, "Lunch", 1, category_id=None)

        response = client.get("/api/spending/description-suggestions?q=L")
        body = response.get_json()
        assert body[0]["description"] == "Lunch"
        assert body[0]["frequency"] == 2
        assert body[0]["last_category_id"] is None

    def test_last_category_id_when_present(self, client, session, sample_category):
        pp = self._setup_pp(session)
        cat_id = sample_category.id
        self._make_entry(session, pp.id, "Lunch", 30, category_id=None)
        self._make_entry(session, pp.id, "Lunch", 1, category_id=cat_id)

        response = client.get("/api/spending/description-suggestions?q=L")
        body = response.get_json()
        assert body[0]["last_category_id"] == cat_id

    def test_multi_word_prefix(self, client, session):
        pp = self._setup_pp(session)
        self._make_entry(session, pp.id, "Coffee at Starbucks", 1)
        self._make_entry(session, pp.id, "Coffee beans", 1)
        self._make_entry(session, pp.id, "Tea", 1)

        response = client.get("/api/spending/description-suggestions?q=Coffee%20at")
        body = response.get_json()
        assert len(body) == 1
        assert body[0]["description"] == "Coffee at Starbucks"

    def test_invalid_days_param(self, client, session):
        response = client.get(
            "/api/spending/description-suggestions?q=L&days=abc"
        )
        assert response.status_code == 400
