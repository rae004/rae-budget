from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.extensions import db
from app.models import PayPeriod
from app.schemas import (
    PayPeriodCreate,
    PayPeriodResponse,
    PayPeriodSummary,
    PayPeriodUpdate,
)
from app.services import (
    calculate_bill_total,
    calculate_remaining,
    calculate_running_total,
    calculate_spending_total,
    create_bills_from_templates,
    get_next_pay_date,
    get_pay_period_end_date,
    repopulate_bills_from_templates,
)

pay_periods_bp = Blueprint("pay_periods", __name__)


@pay_periods_bp.route("/pay-periods", methods=["GET"])
def list_pay_periods():
    """List all pay periods, ordered by start date descending."""
    session = db.get_session()
    try:
        pay_periods = (
            session.query(PayPeriod).order_by(PayPeriod.start_date.desc()).all()
        )
        result = [
            PayPeriodResponse.model_validate(pp).model_dump(mode="json")
            for pp in pay_periods
        ]
        return jsonify(result)
    finally:
        session.close()


@pay_periods_bp.route("/pay-periods/suggest", methods=["GET"])
def suggest_pay_period():
    """Suggest dates for the next pay period based on the 6th/20th schedule."""
    from datetime import date

    # Get reference date from query param or use today
    ref_date_str = request.args.get("from_date")
    if ref_date_str:
        try:
            ref_date = date.fromisoformat(ref_date_str)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    else:
        ref_date = date.today()

    start_date = get_next_pay_date(ref_date)
    end_date = get_pay_period_end_date(start_date)

    return jsonify(
        {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }
    )


@pay_periods_bp.route("/pay-periods/<int:pay_period_id>", methods=["GET"])
def get_pay_period(pay_period_id: int):
    """Get a single pay period with calculated summary."""
    session = db.get_session()
    try:
        pay_period = session.query(PayPeriod).filter_by(id=pay_period_id).first()
        if not pay_period:
            return jsonify({"error": "Pay period not found"}), 404

        summary = PayPeriodSummary(
            bill_total=calculate_bill_total(pay_period),
            spending_total=calculate_spending_total(pay_period),
            running_total=calculate_running_total(pay_period),
            remaining=calculate_remaining(pay_period),
        )

        response = PayPeriodResponse.model_validate(pay_period).model_dump(mode="json")
        response["summary"] = summary.model_dump(mode="json")

        return jsonify(response)
    finally:
        session.close()


@pay_periods_bp.route("/pay-periods", methods=["POST"])
def create_pay_period():
    """Create a new pay period."""
    try:
        data = PayPeriodCreate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    session = db.get_session()
    try:
        pay_period = PayPeriod(
            start_date=data.start_date,
            end_date=data.end_date,
            expected_income=data.expected_income,
            actual_income=data.actual_income,
            notes=data.notes,
        )
        session.add(pay_period)
        session.commit()
        session.refresh(pay_period)

        # Optionally auto-populate bills from templates
        if request.args.get("populate_bills", "false").lower() == "true":
            bills = create_bills_from_templates(session, pay_period)
            for bill in bills:
                session.add(bill)
            session.commit()

        result = PayPeriodResponse.model_validate(pay_period).model_dump(mode="json")
        return jsonify(result), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@pay_periods_bp.route("/pay-periods/<int:pay_period_id>", methods=["PUT"])
def update_pay_period(pay_period_id: int):
    """Update a pay period."""
    try:
        data = PayPeriodUpdate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    session = db.get_session()
    try:
        pay_period = session.query(PayPeriod).filter_by(id=pay_period_id).first()
        if not pay_period:
            return jsonify({"error": "Pay period not found"}), 404

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(pay_period, key, value)

        session.commit()
        session.refresh(pay_period)

        result = PayPeriodResponse.model_validate(pay_period).model_dump(mode="json")
        return jsonify(result)
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@pay_periods_bp.route("/pay-periods/<int:pay_period_id>", methods=["DELETE"])
def delete_pay_period(pay_period_id: int):
    """Delete a pay period and all associated bills/spending."""
    session = db.get_session()
    try:
        pay_period = session.query(PayPeriod).filter_by(id=pay_period_id).first()
        if not pay_period:
            return jsonify({"error": "Pay period not found"}), 404

        session.delete(pay_period)
        session.commit()

        return "", 204
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@pay_periods_bp.route(
    "/pay-periods/<int:pay_period_id>/repopulate-bills", methods=["POST"]
)
def repopulate_pay_period_bills(pay_period_id: int):
    """
    Re-populate bills for a single pay period from templates.

    Deletes existing template-based bills and re-creates them using the
    current due date filtering logic. Preserves manually-added bills.
    """
    session = db.get_session()
    try:
        pay_period = session.query(PayPeriod).filter_by(id=pay_period_id).first()
        if not pay_period:
            return jsonify({"error": "Pay period not found"}), 404

        result = repopulate_bills_from_templates(session, pay_period)
        session.commit()

        return jsonify(
            {
                "pay_period_id": pay_period_id,
                "bills_deleted": result["deleted"],
                "bills_created": result["created"],
            }
        )
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@pay_periods_bp.route("/pay-periods/repopulate-all-bills", methods=["POST"])
def repopulate_all_pay_period_bills():
    """
    Re-populate bills for ALL pay periods from templates.

    For each pay period, deletes existing template-based bills and re-creates
    them using the current due date filtering logic. Preserves manually-added bills.

    Requires X-Confirm-Repopulate header to be set to 'REPOPULATE-ALL'.
    """
    # Require confirmation header
    confirm_header = request.headers.get("X-Confirm-Repopulate")
    if confirm_header != "REPOPULATE-ALL":
        return jsonify(
            {
                "error": "Missing or invalid confirmation header. "
                "Set X-Confirm-Repopulate: REPOPULATE-ALL"
            }
        ), 400

    session = db.get_session()
    try:
        pay_periods = session.query(PayPeriod).all()

        total_deleted = 0
        total_created = 0
        pay_periods_updated = 0

        for pay_period in pay_periods:
            result = repopulate_bills_from_templates(session, pay_period)
            total_deleted += result["deleted"]
            total_created += result["created"]
            pay_periods_updated += 1

        session.commit()

        return jsonify(
            {
                "pay_periods_updated": pay_periods_updated,
                "total_bills_deleted": total_deleted,
                "total_bills_created": total_created,
            }
        )
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
