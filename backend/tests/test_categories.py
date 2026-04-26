"""Tests for category routes."""

import json
from datetime import date
from decimal import Decimal

from app.models import BillTemplate, Category, SpendingEntry


class TestListCategories:
    """GET /api/categories"""

    def test_empty(self, client, session):
        """Returns [] when no categories exist."""
        response = client.get("/api/categories")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_returns_categories_sorted_by_name(self, client, session):
        """Categories come back sorted alphabetically."""
        session.add_all(
            [
                Category(name="Zoo", color="#000000"),
                Category(name="Apple", color="#ff0000"),
                Category(name="Mango", color="#00ff00"),
            ]
        )
        session.commit()

        response = client.get("/api/categories")
        names = [c["name"] for c in response.get_json()]
        assert names == ["Apple", "Mango", "Zoo"]


class TestGetCategory:
    """GET /api/categories/:id"""

    def test_found(self, client, sample_category):
        response = client.get(f"/api/categories/{sample_category.id}")
        assert response.status_code == 200
        assert response.get_json()["name"] == "Food"

    def test_not_found(self, client, session):
        response = client.get("/api/categories/9999")
        assert response.status_code == 404
        assert response.get_json() == {"error": "Category not found"}


class TestCreateCategory:
    """POST /api/categories"""

    def test_create_minimal(self, client, session):
        """Can create with just a name."""
        response = client.post(
            "/api/categories",
            data=json.dumps({"name": "Groceries"}),
            content_type="application/json",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["name"] == "Groceries"
        assert body["id"] is not None

    def test_create_full(self, client, session):
        """Can create with name, description, color."""
        response = client.post(
            "/api/categories",
            data=json.dumps(
                {
                    "name": "Travel",
                    "description": "Flights and hotels",
                    "color": "#3b82f6",
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["description"] == "Flights and hotels"
        assert body["color"] == "#3b82f6"

    def test_create_validation_error(self, client, session):
        """Missing required name returns 400."""
        response = client.post(
            "/api/categories",
            data=json.dumps({}),
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "error" in response.get_json()


class TestUpdateCategory:
    """PUT /api/categories/:id"""

    def test_update_name(self, client, sample_category):
        response = client.put(
            f"/api/categories/{sample_category.id}",
            data=json.dumps({"name": "Dining Out"}),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.get_json()["name"] == "Dining Out"

    def test_partial_update_preserves_other_fields(self, client, sample_category):
        """Updating only one field leaves the others intact."""
        original_color = sample_category.color
        response = client.put(
            f"/api/categories/{sample_category.id}",
            data=json.dumps({"name": "Renamed"}),
            content_type="application/json",
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["name"] == "Renamed"
        assert body["color"] == original_color

    def test_not_found(self, client, session):
        response = client.put(
            "/api/categories/9999",
            data=json.dumps({"name": "x"}),
            content_type="application/json",
        )
        assert response.status_code == 404


class TestDeleteCategory:
    """DELETE /api/categories/:id — covers the in-use guard + force override."""

    def test_delete_unused_category(self, client, session, sample_category):
        """An unreferenced category can be deleted with no force flag."""
        response = client.delete(f"/api/categories/{sample_category.id}")
        assert response.status_code == 204
        assert session.query(Category).filter_by(id=sample_category.id).first() is None

    def test_delete_not_found(self, client, session):
        response = client.delete("/api/categories/9999")
        assert response.status_code == 404

    def test_delete_in_use_by_spending_returns_409(
        self, client, session, sample_category, sample_pay_period
    ):
        """Category referenced by spending entries returns 409 with counts."""
        session.add(
            SpendingEntry(
                pay_period_id=sample_pay_period.id,
                category_id=sample_category.id,
                description="Lunch",
                amount=Decimal("12.00"),
                spent_date=date(2026, 4, 10),
            )
        )
        session.commit()

        response = client.delete(f"/api/categories/{sample_category.id}")
        assert response.status_code == 409
        body = response.get_json()
        assert body["error"] == "in_use"
        assert body["spending_entries"] == 1
        assert body["bill_templates"] == 0

    def test_delete_in_use_by_bill_template_returns_409(
        self, client, session, sample_category
    ):
        """Category referenced by bill templates returns 409 with counts."""
        session.add(
            BillTemplate(
                name="Streaming",
                default_amount=Decimal("15.00"),
                category_id=sample_category.id,
            )
        )
        session.commit()

        response = client.delete(f"/api/categories/{sample_category.id}")
        assert response.status_code == 409
        body = response.get_json()
        assert body["bill_templates"] == 1
        assert body["spending_entries"] == 0

    def test_delete_in_use_by_both_returns_combined_counts(
        self, client, session, sample_category, sample_pay_period
    ):
        """409 body shows both counts when category is referenced by both."""
        session.add(
            BillTemplate(
                name="Streaming",
                default_amount=Decimal("15.00"),
                category_id=sample_category.id,
            )
        )
        session.add(
            SpendingEntry(
                pay_period_id=sample_pay_period.id,
                category_id=sample_category.id,
                description="Lunch",
                amount=Decimal("12.00"),
                spent_date=date(2026, 4, 10),
            )
        )
        session.commit()

        response = client.delete(f"/api/categories/{sample_category.id}")
        assert response.status_code == 409
        body = response.get_json()
        assert body["bill_templates"] == 1
        assert body["spending_entries"] == 1

    def test_delete_with_force_bypasses_in_use_check(
        self, client, session, sample_category, sample_pay_period
    ):
        """?force=true deletes even when references exist."""
        session.add(
            SpendingEntry(
                pay_period_id=sample_pay_period.id,
                category_id=sample_category.id,
                description="Lunch",
                amount=Decimal("12.00"),
                spent_date=date(2026, 4, 10),
            )
        )
        session.commit()

        response = client.delete(f"/api/categories/{sample_category.id}?force=true")
        assert response.status_code == 204
        assert session.query(Category).filter_by(id=sample_category.id).first() is None

    def test_force_query_param_is_case_insensitive(self, client, sample_category):
        """force=TRUE works as well as force=true."""
        response = client.delete(f"/api/categories/{sample_category.id}?force=TRUE")
        assert response.status_code == 204

    def test_force_false_still_runs_in_use_check(
        self, client, session, sample_category, sample_pay_period
    ):
        """?force=false (or any other value) runs the guard."""
        session.add(
            SpendingEntry(
                pay_period_id=sample_pay_period.id,
                category_id=sample_category.id,
                description="Lunch",
                amount=Decimal("12.00"),
                spent_date=date(2026, 4, 10),
            )
        )
        session.commit()

        response = client.delete(f"/api/categories/{sample_category.id}?force=false")
        assert response.status_code == 409
