"""Tests for bill template routes."""

import json
from decimal import Decimal

from app.models import BillTemplate


class TestListBillTemplates:
    """GET /api/bill-templates"""

    def test_empty(self, client, session):
        response = client.get("/api/bill-templates")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_returns_sorted_by_name(self, client, session):
        session.add_all(
            [
                BillTemplate(name="Zoo", default_amount=Decimal("10.00")),
                BillTemplate(name="Apple", default_amount=Decimal("20.00")),
                BillTemplate(name="Mango", default_amount=Decimal("30.00")),
            ]
        )
        session.commit()

        response = client.get("/api/bill-templates")
        names = [t["name"] for t in response.get_json()]
        assert names == ["Apple", "Mango", "Zoo"]


class TestGetBillTemplate:
    """GET /api/bill-templates/:id"""

    def test_found(self, client, sample_bill_template):
        response = client.get(f"/api/bill-templates/{sample_bill_template.id}")
        assert response.status_code == 200
        body = response.get_json()
        assert body["name"] == "Rent"
        assert body["default_amount"] == "1500.00"

    def test_not_found(self, client, session):
        response = client.get("/api/bill-templates/9999")
        assert response.status_code == 404


class TestCreateBillTemplate:
    """POST /api/bill-templates"""

    def test_create_minimal(self, client, session):
        response = client.post(
            "/api/bill-templates",
            data=json.dumps({"name": "Internet", "default_amount": 75}),
            content_type="application/json",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["name"] == "Internet"
        assert body["is_recurring"] is True

    def test_create_full(self, client, sample_category):
        cat_id = sample_category.id
        response = client.post(
            "/api/bill-templates",
            data=json.dumps(
                {
                    "name": "Streaming",
                    "default_amount": 15.99,
                    "due_day_of_month": 15,
                    "is_recurring": True,
                    "category_id": cat_id,
                    "notes": "Annual plan",
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["due_day_of_month"] == 15
        assert body["category_id"] == cat_id
        assert body["notes"] == "Annual plan"

    def test_create_validation_error(self, client, session):
        """Missing required fields returns 400."""
        response = client.post(
            "/api/bill-templates",
            data=json.dumps({}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_create_rejects_invalid_due_day(self, client, session):
        response = client.post(
            "/api/bill-templates",
            data=json.dumps(
                {
                    "name": "Bad",
                    "default_amount": 1,
                    "due_day_of_month": 32,
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 400


class TestUpdateBillTemplate:
    """PUT /api/bill-templates/:id"""

    def test_update_name(self, client, sample_bill_template):
        response = client.put(
            f"/api/bill-templates/{sample_bill_template.id}",
            data=json.dumps({"name": "Mortgage"}),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.get_json()["name"] == "Mortgage"

    def test_partial_update_preserves_other_fields(self, client, sample_bill_template):
        original_amount = sample_bill_template.default_amount
        response = client.put(
            f"/api/bill-templates/{sample_bill_template.id}",
            data=json.dumps({"name": "Renamed"}),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.get_json()["default_amount"] == f"{original_amount:.2f}"

    def test_validation_error(self, client, sample_bill_template):
        response = client.put(
            f"/api/bill-templates/{sample_bill_template.id}",
            data=json.dumps({"default_amount": -1}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_not_found(self, client, session):
        response = client.put(
            "/api/bill-templates/9999",
            data=json.dumps({"name": "x"}),
            content_type="application/json",
        )
        assert response.status_code == 404


class TestDeleteBillTemplate:
    """DELETE /api/bill-templates/:id"""

    def test_delete(self, client, session, sample_bill_template):
        template_id = sample_bill_template.id
        response = client.delete(f"/api/bill-templates/{template_id}")
        assert response.status_code == 204
        assert session.query(BillTemplate).filter_by(id=template_id).first() is None

    def test_not_found(self, client, session):
        response = client.delete("/api/bill-templates/9999")
        assert response.status_code == 404
