import json

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.extensions import db
from app.models import PayPeriod, PayPeriodBill
from app.schemas import (
    PayPeriodBillCreate,
    PayPeriodBillResponse,
    PayPeriodBillUpdate,
)

bills_bp = Blueprint("bills", __name__)


@bills_bp.route("/bills", methods=["GET"])
def list_all_bills():
    """List all bills across every pay period (used by the Insights dashboard)."""
    session = db.get_session()
    try:
        bills = session.query(PayPeriodBill).all()
        result = [
            PayPeriodBillResponse.model_validate(bill).model_dump(mode="json")
            for bill in bills
        ]
        return jsonify(result)
    finally:
        session.close()


@bills_bp.route("/pay-periods/<int:pay_period_id>/bills", methods=["GET"])
def list_bills(pay_period_id: int):
    """List all bills for a pay period."""
    session = db.get_session()
    try:
        pay_period = session.query(PayPeriod).filter_by(id=pay_period_id).first()
        if not pay_period:
            return jsonify({"error": "Pay period not found"}), 404

        result = [
            PayPeriodBillResponse.model_validate(bill).model_dump(mode="json")
            for bill in pay_period.bills
        ]
        return jsonify(result)
    finally:
        session.close()


@bills_bp.route("/pay-periods/<int:pay_period_id>/bills", methods=["POST"])
def create_bill(pay_period_id: int):
    """Add a bill to a pay period."""
    try:
        data = PayPeriodBillCreate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": json.loads(e.json())}), 400

    session = db.get_session()
    try:
        pay_period = session.query(PayPeriod).filter_by(id=pay_period_id).first()
        if not pay_period:
            return jsonify({"error": "Pay period not found"}), 404

        bill = PayPeriodBill(
            pay_period_id=pay_period_id,
            bill_template_id=data.bill_template_id,
            name=data.name,
            amount=data.amount,
            due_date=data.due_date,
            is_paid=data.is_paid,
            paid_date=data.paid_date,
            notes=data.notes,
        )
        session.add(bill)
        session.commit()
        session.refresh(bill)

        result = PayPeriodBillResponse.model_validate(bill).model_dump(mode="json")
        return jsonify(result), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@bills_bp.route("/bills/<int:bill_id>", methods=["PUT"])
def update_bill(bill_id: int):
    """Update a bill."""
    try:
        data = PayPeriodBillUpdate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": json.loads(e.json())}), 400

    session = db.get_session()
    try:
        bill = session.query(PayPeriodBill).filter_by(id=bill_id).first()
        if not bill:
            return jsonify({"error": "Bill not found"}), 404

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(bill, key, value)

        session.commit()
        session.refresh(bill)

        result = PayPeriodBillResponse.model_validate(bill).model_dump(mode="json")
        return jsonify(result)
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@bills_bp.route("/bills/<int:bill_id>", methods=["DELETE"])
def delete_bill(bill_id: int):
    """Delete a bill."""
    session = db.get_session()
    try:
        bill = session.query(PayPeriodBill).filter_by(id=bill_id).first()
        if not bill:
            return jsonify({"error": "Bill not found"}), 404

        session.delete(bill)
        session.commit()

        return "", 204
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
