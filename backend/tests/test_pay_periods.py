import json
from datetime import date
from decimal import Decimal

from app.models import BillTemplate, PayPeriod


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


class TestListPayPeriods:
    """GET /api/pay-periods"""

    def test_empty(self, client, session):
        response = client.get("/api/pay-periods")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_returns_descending_by_start_date(self, client, session):
        """Most recent pay period comes first."""
        session.add_all(
            [
                PayPeriod(
                    start_date=date(2026, 1, 6),
                    end_date=date(2026, 1, 19),
                    expected_income=Decimal("2500.00"),
                ),
                PayPeriod(
                    start_date=date(2026, 4, 6),
                    end_date=date(2026, 4, 19),
                    expected_income=Decimal("2500.00"),
                ),
                PayPeriod(
                    start_date=date(2026, 2, 20),
                    end_date=date(2026, 3, 5),
                    expected_income=Decimal("2500.00"),
                ),
            ]
        )
        session.commit()

        response = client.get("/api/pay-periods")
        starts = [p["start_date"] for p in response.get_json()]
        assert starts == ["2026-04-06", "2026-02-20", "2026-01-06"]


class TestSuggestPayPeriod:
    """GET /api/pay-periods/suggest"""

    def test_default_uses_today(self, client, session):
        """Returns ISO-formatted start_date and end_date."""
        response = client.get("/api/pay-periods/suggest")
        assert response.status_code == 200
        body = response.get_json()
        assert "start_date" in body
        assert "end_date" in body

    def test_with_explicit_from_date(self, client, session):
        """Reference date param drives the suggestion."""
        response = client.get("/api/pay-periods/suggest?from_date=2026-04-01")
        assert response.status_code == 200
        body = response.get_json()
        # Per the 6th/20th schedule, after 2026-04-01 the next pay date is 2026-04-06
        assert body["start_date"] == "2026-04-06"
        assert body["end_date"] == "2026-04-19"

    def test_invalid_date_returns_400(self, client, session):
        response = client.get("/api/pay-periods/suggest?from_date=not-a-date")
        assert response.status_code == 400
        assert "YYYY-MM-DD" in response.get_json()["error"]


class TestGetPayPeriod:
    """GET /api/pay-periods/:id (with calculated summary)"""

    def test_returns_pay_period_with_summary(self, client, sample_pay_period):
        response = client.get(f"/api/pay-periods/{sample_pay_period.id}")
        assert response.status_code == 200
        body = response.get_json()
        assert body["id"] == sample_pay_period.id
        assert "summary" in body
        for key in ("bill_total", "spending_total", "running_total", "remaining"):
            assert key in body["summary"]

    def test_summary_reflects_bills_and_spending(
        self, client, session, sample_pay_period, sample_bill, sample_spending
    ):
        response = client.get(f"/api/pay-periods/{sample_pay_period.id}")
        body = response.get_json()
        # sample_bill is 1500, sample_spending is 150 → running 1650, remaining = 2500 - 1650 = 850
        assert body["summary"]["bill_total"] == "1500.00"
        assert body["summary"]["spending_total"] == "150.00"
        assert body["summary"]["running_total"] == "1650.00"
        assert body["summary"]["remaining"] == "850.00"

    def test_not_found(self, client, session):
        response = client.get("/api/pay-periods/9999")
        assert response.status_code == 404


class TestCreatePayPeriod:
    """POST /api/pay-periods"""

    def test_create_minimal(self, client, session):
        response = client.post(
            "/api/pay-periods",
            data=json.dumps(
                {
                    "start_date": "2026-04-06",
                    "end_date": "2026-04-19",
                    "expected_income": 2500,
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["start_date"] == "2026-04-06"
        assert body["expected_income"] == "2500.00"

    def test_validation_error_when_end_before_start(self, client, session):
        """The schema's model_validator rejects end < start with a clean 400."""
        response = client.post(
            "/api/pay-periods",
            data=json.dumps(
                {
                    "start_date": "2026-04-19",
                    "end_date": "2026-04-06",
                    "expected_income": 2500,
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 400
        body = response.get_json()
        assert "error" in body
        # The serialized error mentions the validator's message
        assert any("end_date" in err.get("msg", "") for err in body["error"])

    def test_validation_error_when_negative_income(self, client, session):
        response = client.post(
            "/api/pay-periods",
            data=json.dumps(
                {
                    "start_date": "2026-04-06",
                    "end_date": "2026-04-19",
                    "expected_income": -100,
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_populate_bills_param_creates_bills_from_templates(
        self, client, session, sample_bill_template
    ):
        """?populate_bills=true seeds bills from active templates."""
        response = client.post(
            "/api/pay-periods?populate_bills=true",
            data=json.dumps(
                {
                    "start_date": "2026-04-06",
                    "end_date": "2026-04-19",
                    "expected_income": 2500,
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        # The detail endpoint should now show the bill in the total
        pay_period_id = response.get_json()["id"]
        detail = client.get(f"/api/pay-periods/{pay_period_id}")
        assert detail.get_json()["summary"]["bill_total"] != "0.00"


class TestUpdatePayPeriod:
    """PUT /api/pay-periods/:id"""

    def test_update_notes(self, client, sample_pay_period):
        response = client.put(
            f"/api/pay-periods/{sample_pay_period.id}",
            data=json.dumps({"notes": "Updated notes"}),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.get_json()["notes"] == "Updated notes"

    def test_update_additional_income(self, client, sample_pay_period):
        response = client.put(
            f"/api/pay-periods/{sample_pay_period.id}",
            data=json.dumps(
                {
                    "additional_income": 100,
                    "additional_income_description": "Side gig",
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["additional_income"] == "100.00"
        assert body["additional_income_description"] == "Side gig"

    def test_partial_update_preserves_other_fields(self, client, sample_pay_period):
        original_income = sample_pay_period.expected_income
        response = client.put(
            f"/api/pay-periods/{sample_pay_period.id}",
            data=json.dumps({"notes": "Just notes"}),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.get_json()["expected_income"] == f"{original_income:.2f}"

    def test_validation_error(self, client, sample_pay_period):
        response = client.put(
            f"/api/pay-periods/{sample_pay_period.id}",
            data=json.dumps({"expected_income": -1}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_not_found(self, client, session):
        response = client.put(
            "/api/pay-periods/9999",
            data=json.dumps({"notes": "x"}),
            content_type="application/json",
        )
        assert response.status_code == 404


class TestDeletePayPeriod:
    """DELETE /api/pay-periods/:id"""

    def test_delete(self, client, session, sample_pay_period):
        response = client.delete(f"/api/pay-periods/{sample_pay_period.id}")
        assert response.status_code == 204
        assert (
            session.query(PayPeriod).filter_by(id=sample_pay_period.id).first() is None
        )

    def test_not_found(self, client, session):
        response = client.delete("/api/pay-periods/9999")
        assert response.status_code == 404


class TestRepopulateBills:
    """POST /api/pay-periods/:id/repopulate-bills"""

    def test_repopulates_for_one_pay_period(
        self, client, session, sample_pay_period, sample_bill_template
    ):
        # Capture id before the request — the route closes the test's session in
        # a finally block, which detaches the fixture object.
        pp_id = sample_pay_period.id
        response = client.post(f"/api/pay-periods/{pp_id}/repopulate-bills")
        assert response.status_code == 200
        body = response.get_json()
        assert body["pay_period_id"] == pp_id
        assert "bills_deleted" in body
        assert "bills_created" in body

    def test_pay_period_not_found(self, client, session):
        response = client.post("/api/pay-periods/9999/repopulate-bills")
        assert response.status_code == 404


class TestRepopulateAllBills:
    """POST /api/pay-periods/repopulate-all-bills"""

    def test_requires_confirmation_header(self, client, session):
        response = client.post("/api/pay-periods/repopulate-all-bills")
        assert response.status_code == 400
        assert "X-Confirm-Repopulate" in response.get_json()["error"]

    def test_rejects_wrong_header_value(self, client, session):
        response = client.post(
            "/api/pay-periods/repopulate-all-bills",
            headers={"X-Confirm-Repopulate": "WRONG"},
        )
        assert response.status_code == 400

    def test_runs_with_correct_header(
        self, client, session, sample_pay_period, sample_bill_template
    ):
        # Add a second pay period so the loop runs more than once
        session.add(
            BillTemplate(
                name="Internet",
                default_amount=Decimal("75.00"),
                due_day_of_month=10,
            )
        )
        session.add(
            PayPeriod(
                start_date=date(2026, 5, 6),
                end_date=date(2026, 5, 19),
                expected_income=Decimal("2500.00"),
            )
        )
        session.commit()

        response = client.post(
            "/api/pay-periods/repopulate-all-bills",
            headers={"X-Confirm-Repopulate": "REPOPULATE-ALL"},
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["pay_periods_updated"] == 2
        assert "total_bills_deleted" in body
        assert "total_bills_created" in body
