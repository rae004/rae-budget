from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.extensions import db
from app.models import PayPeriod, SpendingEntry
from app.schemas import (
    SpendingEntryCreate,
    SpendingEntryResponse,
    SpendingEntryUpdate,
)

spending_bp = Blueprint("spending", __name__)


@spending_bp.route("/pay-periods/<int:pay_period_id>/spending", methods=["GET"])
def list_spending(pay_period_id: int):
    """List all spending entries for a pay period."""
    session = db.get_session()
    try:
        pay_period = session.query(PayPeriod).filter_by(id=pay_period_id).first()
        if not pay_period:
            return jsonify({"error": "Pay period not found"}), 404

        result = [
            SpendingEntryResponse.model_validate(entry).model_dump()
            for entry in pay_period.spending_entries
        ]
        return jsonify(result)
    finally:
        session.close()


@spending_bp.route("/pay-periods/<int:pay_period_id>/spending", methods=["POST"])
def create_spending(pay_period_id: int):
    """Add a spending entry to a pay period."""
    try:
        data = SpendingEntryCreate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    session = db.get_session()
    try:
        pay_period = session.query(PayPeriod).filter_by(id=pay_period_id).first()
        if not pay_period:
            return jsonify({"error": "Pay period not found"}), 404

        entry = SpendingEntry(
            pay_period_id=pay_period_id,
            description=data.description,
            amount=data.amount,
            spent_date=data.spent_date,
            category_id=data.category_id,
            notes=data.notes,
        )
        session.add(entry)
        session.commit()
        session.refresh(entry)

        result = SpendingEntryResponse.model_validate(entry).model_dump()
        return jsonify(result), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@spending_bp.route("/spending/<int:spending_id>", methods=["PUT"])
def update_spending(spending_id: int):
    """Update a spending entry."""
    try:
        data = SpendingEntryUpdate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    session = db.get_session()
    try:
        entry = session.query(SpendingEntry).filter_by(id=spending_id).first()
        if not entry:
            return jsonify({"error": "Spending entry not found"}), 404

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(entry, key, value)

        session.commit()
        session.refresh(entry)

        result = SpendingEntryResponse.model_validate(entry).model_dump()
        return jsonify(result)
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@spending_bp.route("/spending/<int:spending_id>", methods=["DELETE"])
def delete_spending(spending_id: int):
    """Delete a spending entry."""
    session = db.get_session()
    try:
        entry = session.query(SpendingEntry).filter_by(id=spending_id).first()
        if not entry:
            return jsonify({"error": "Spending entry not found"}), 404

        session.delete(entry)
        session.commit()

        return "", 204
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
