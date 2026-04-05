"""Tests for data export, import, and reset functionality."""

import json
from datetime import date
from decimal import Decimal

from app.models import BillTemplate, Category, PayPeriod, PayPeriodBill, SpendingEntry


class TestDataExport:
    """Tests for data export endpoint."""

    def test_export_empty_data(self, client, session):
        """Export returns valid structure with empty data."""
        response = client.get("/api/data/export")

        assert response.status_code == 200
        assert response.content_type == "application/json"
        assert "attachment" in response.headers.get("Content-Disposition", "")

        data = json.loads(response.data)
        assert data["export_version"] == "1.0"
        assert "export_date" in data
        assert data["data"]["categories"] == []
        assert data["data"]["bill_templates"] == []
        assert data["data"]["pay_periods"] == []

    def test_export_with_categories(self, client, session, sample_category):
        """Export includes categories."""
        response = client.get("/api/data/export")
        data = json.loads(response.data)

        assert len(data["data"]["categories"]) == 1
        cat = data["data"]["categories"][0]
        assert cat["name"] == "Food"
        assert cat["description"] == "Food and dining"
        assert cat["color"] == "#f59e0b"
        # IDs should not be exported
        assert "id" not in cat

    def test_export_with_bill_templates(self, client, session, sample_bill_template):
        """Export includes bill templates."""
        response = client.get("/api/data/export")
        data = json.loads(response.data)

        assert len(data["data"]["bill_templates"]) == 1
        bt = data["data"]["bill_templates"][0]
        assert bt["name"] == "Rent"
        assert bt["default_amount"] == "1500.00"
        assert bt["due_day_of_month"] == 1
        assert bt["is_recurring"] is True
        assert "id" not in bt

    def test_export_with_pay_period_and_bills(
        self, client, session, sample_pay_period, sample_bill
    ):
        """Export includes pay periods with nested bills."""
        response = client.get("/api/data/export")
        data = json.loads(response.data)

        assert len(data["data"]["pay_periods"]) == 1
        pp = data["data"]["pay_periods"][0]
        assert pp["start_date"] == "2026-04-06"
        assert pp["end_date"] == "2026-04-19"
        assert pp["expected_income"] == "2500.00"
        assert len(pp["bills"]) == 1
        assert pp["bills"][0]["name"] == "Rent"
        assert pp["bills"][0]["amount"] == "1500.00"

    def test_export_with_spending(self, client, session, sample_spending):
        """Export includes spending entries."""
        response = client.get("/api/data/export")
        data = json.loads(response.data)

        assert len(data["data"]["pay_periods"]) == 1
        pp = data["data"]["pay_periods"][0]
        assert len(pp["spending_entries"]) == 1
        se = pp["spending_entries"][0]
        assert se["description"] == "Groceries at Publix"
        assert se["amount"] == "150.00"
        assert se["category_name"] == "Food"

    def test_export_bill_template_with_category(self, client, session, sample_category):
        """Export maps bill template category_id to category_name."""
        template = BillTemplate(
            name="Groceries",
            default_amount=Decimal("200.00"),
            category_id=sample_category.id,
        )
        session.add(template)
        session.commit()

        response = client.get("/api/data/export")
        data = json.loads(response.data)

        bt = data["data"]["bill_templates"][0]
        assert bt["category_name"] == "Food"


class TestDataImport:
    """Tests for data import endpoint."""

    def test_import_empty_data(self, client, session):
        """Import with empty data returns zero counts."""
        import_data = {
            "export_version": "1.0",
            "export_date": "2026-04-05T10:00:00Z",
            "data": {
                "categories": [],
                "bill_templates": [],
                "pay_periods": [],
            },
        }

        response = client.post(
            "/api/data/import",
            data=json.dumps(import_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert result["categories_created"] == 0
        assert result["bill_templates_created"] == 0
        assert result["pay_periods_created"] == 0

    def test_import_categories(self, client, session):
        """Import creates new categories."""
        import_data = {
            "export_version": "1.0",
            "export_date": "2026-04-05T10:00:00Z",
            "data": {
                "categories": [
                    {
                        "name": "Utilities",
                        "description": "Monthly utilities",
                        "color": "#3b82f6",
                    },
                    {"name": "Entertainment", "description": None, "color": "#8b5cf6"},
                ],
                "bill_templates": [],
                "pay_periods": [],
            },
        }

        response = client.post(
            "/api/data/import",
            data=json.dumps(import_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert result["categories_created"] == 2

        # Verify in database
        categories = session.query(Category).all()
        assert len(categories) == 2

    def test_import_skips_existing_categories(self, client, session, sample_category):
        """Import skips categories that already exist by name."""
        import_data = {
            "export_version": "1.0",
            "export_date": "2026-04-05T10:00:00Z",
            "data": {
                "categories": [
                    {
                        "name": "Food",
                        "description": "Different desc",
                        "color": "#000000",
                    },
                    {"name": "NewCategory", "description": None, "color": "#ffffff"},
                ],
                "bill_templates": [],
                "pay_periods": [],
            },
        }

        response = client.post(
            "/api/data/import",
            data=json.dumps(import_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert result["categories_created"] == 1
        assert result["categories_skipped"] == 1

    def test_import_bill_templates(self, client, session):
        """Import creates bill templates."""
        import_data = {
            "export_version": "1.0",
            "export_date": "2026-04-05T10:00:00Z",
            "data": {
                "categories": [],
                "bill_templates": [
                    {
                        "name": "Internet",
                        "default_amount": "79.99",
                        "due_day_of_month": 15,
                        "is_recurring": True,
                        "category_name": None,
                        "notes": None,
                    }
                ],
                "pay_periods": [],
            },
        }

        response = client.post(
            "/api/data/import",
            data=json.dumps(import_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert result["bill_templates_created"] == 1

        # Verify in database
        templates = session.query(BillTemplate).all()
        assert len(templates) == 1
        assert templates[0].name == "Internet"
        assert templates[0].default_amount == Decimal("79.99")

    def test_import_bill_template_with_category_mapping(
        self, client, session, sample_category
    ):
        """Import maps category_name to existing category_id."""
        # Store the category id before the API call since session may be detached
        expected_category_id = sample_category.id

        import_data = {
            "export_version": "1.0",
            "export_date": "2026-04-05T10:00:00Z",
            "data": {
                "categories": [],
                "bill_templates": [
                    {
                        "name": "Groceries",
                        "default_amount": "300.00",
                        "due_day_of_month": None,
                        "is_recurring": False,
                        "category_name": "Food",
                        "notes": None,
                    }
                ],
                "pay_periods": [],
            },
        }

        response = client.post(
            "/api/data/import",
            data=json.dumps(import_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        template = session.query(BillTemplate).first()
        assert template.category_id == expected_category_id

    def test_import_pay_periods_with_bills_and_spending(self, client, session):
        """Import creates pay periods with nested bills and spending."""
        import_data = {
            "export_version": "1.0",
            "export_date": "2026-04-05T10:00:00Z",
            "data": {
                "categories": [
                    {"name": "Food", "description": None, "color": "#f59e0b"},
                ],
                "bill_templates": [],
                "pay_periods": [
                    {
                        "start_date": "2026-04-06",
                        "end_date": "2026-04-19",
                        "expected_income": "2500.00",
                        "actual_income": None,
                        "notes": "Test period",
                        "bills": [
                            {
                                "name": "Rent",
                                "amount": "1500.00",
                                "due_date": "2026-04-01",
                                "is_paid": True,
                                "paid_date": "2026-04-01",
                                "notes": None,
                                "bill_template_name": None,
                            }
                        ],
                        "spending_entries": [
                            {
                                "description": "Coffee",
                                "amount": "5.00",
                                "spent_date": "2026-04-07",
                                "category_name": "Food",
                                "notes": None,
                            }
                        ],
                    }
                ],
            },
        }

        response = client.post(
            "/api/data/import",
            data=json.dumps(import_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert result["categories_created"] == 1
        assert result["pay_periods_created"] == 1
        assert result["bills_created"] == 1
        assert result["spending_entries_created"] == 1

        # Verify in database
        pay_period = session.query(PayPeriod).first()
        assert pay_period is not None
        assert pay_period.start_date == date(2026, 4, 6)
        assert len(pay_period.bills) == 1
        assert pay_period.bills[0].name == "Rent"
        assert pay_period.bills[0].is_paid is True
        assert len(pay_period.spending_entries) == 1
        assert pay_period.spending_entries[0].description == "Coffee"

    def test_import_invalid_format(self, client, session):
        """Import rejects invalid data format."""
        import_data = {"invalid": "data"}

        response = client.post(
            "/api/data/import",
            data=json.dumps(import_data),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_import_invalid_version_format(self, client, session):
        """Import rejects invalid version format."""
        import_data = {
            "export_version": "invalid",
            "export_date": "2026-04-05T10:00:00Z",
            "data": {
                "categories": [],
                "bill_templates": [],
                "pay_periods": [],
            },
        }

        response = client.post(
            "/api/data/import",
            data=json.dumps(import_data),
            content_type="application/json",
        )

        assert response.status_code == 400


class TestDataReset:
    """Tests for data reset endpoint."""

    def test_reset_requires_confirmation_header(self, client, session):
        """Reset fails without confirmation header."""
        response = client.delete("/api/data/reset")

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "X-Confirm-Reset" in data["error"]

    def test_reset_requires_correct_header_value(self, client, session):
        """Reset fails with incorrect header value."""
        response = client.delete(
            "/api/data/reset",
            headers={"X-Confirm-Reset": "wrong-value"},
        )

        assert response.status_code == 400

    def test_reset_deletes_all_data(
        self,
        client,
        session,
        sample_category,
        sample_bill_template,
        sample_pay_period,
        sample_bill,
        sample_spending,
    ):
        """Reset deletes all data with correct header."""
        # Verify data exists
        assert session.query(Category).count() == 1
        assert session.query(BillTemplate).count() == 1
        assert session.query(PayPeriod).count() == 1
        assert session.query(PayPeriodBill).count() == 1
        assert session.query(SpendingEntry).count() == 1

        response = client.delete(
            "/api/data/reset",
            headers={"X-Confirm-Reset": "DELETE-ALL-DATA"},
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert result["categories_deleted"] == 1
        assert result["bill_templates_deleted"] == 1
        assert result["pay_periods_deleted"] == 1
        assert result["bills_deleted"] == 1
        assert result["spending_entries_deleted"] == 1

        # Verify data is deleted
        assert session.query(Category).count() == 0
        assert session.query(BillTemplate).count() == 0
        assert session.query(PayPeriod).count() == 0
        assert session.query(PayPeriodBill).count() == 0
        assert session.query(SpendingEntry).count() == 0

    def test_reset_empty_database(self, client, session):
        """Reset on empty database returns zero counts."""
        response = client.delete(
            "/api/data/reset",
            headers={"X-Confirm-Reset": "DELETE-ALL-DATA"},
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert result["categories_deleted"] == 0
        assert result["bill_templates_deleted"] == 0
        assert result["pay_periods_deleted"] == 0


class TestExportImportRoundTrip:
    """Tests for export/import round trip."""

    def test_round_trip_preserves_data(
        self,
        client,
        session,
        sample_category,
        sample_bill_template,
        sample_pay_period,
        sample_bill,
        sample_spending,
    ):
        """Data exported and re-imported creates equivalent data."""
        # Export data
        export_response = client.get("/api/data/export")
        exported_data = json.loads(export_response.data)

        # Reset data
        client.delete(
            "/api/data/reset",
            headers={"X-Confirm-Reset": "DELETE-ALL-DATA"},
        )

        # Verify reset
        assert session.query(Category).count() == 0
        assert session.query(PayPeriod).count() == 0

        # Re-import data
        import_response = client.post(
            "/api/data/import",
            data=json.dumps(exported_data),
            content_type="application/json",
        )

        assert import_response.status_code == 200

        # Verify data is restored
        assert session.query(Category).count() == 1
        assert session.query(BillTemplate).count() == 1
        assert session.query(PayPeriod).count() == 1
        assert session.query(PayPeriodBill).count() == 1
        assert session.query(SpendingEntry).count() == 1

        # Verify data values
        category = session.query(Category).first()
        assert category.name == "Food"

        pay_period = session.query(PayPeriod).first()
        assert pay_period.expected_income == Decimal("2500.00")
        assert pay_period.bills[0].name == "Rent"
        assert pay_period.spending_entries[0].description == "Groceries at Publix"
