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
            PayPeriodResponse.model_validate(pp).model_dump() for pp in pay_periods
        ]
        return jsonify(result)
    finally:
        session.close()


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

        response = PayPeriodResponse.model_validate(pay_period).model_dump()
        response["summary"] = summary.model_dump()

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

        result = PayPeriodResponse.model_validate(pay_period).model_dump()
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

        result = PayPeriodResponse.model_validate(pay_period).model_dump()
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
