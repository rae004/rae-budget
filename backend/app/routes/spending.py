import json
from datetime import UTC, datetime, timedelta

from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from sqlalchemy import desc, func, select

from app.extensions import db
from app.models import PayPeriod, SpendingEntry
from app.schemas import (
    SpendingDescriptionSuggestion,
    SpendingEntryCreate,
    SpendingEntryResponse,
    SpendingEntryUpdate,
)

spending_bp = Blueprint("spending", __name__)


@spending_bp.route("/spending/description-suggestions", methods=["GET"])
def description_suggestions():
    """Return distinct recent spending descriptions matching a prefix.

    Used to autofill the description field on the add-spending form. Returns
    descriptions case-insensitively starting with `q`, ordered by frequency
    over the last `days` days. Each suggestion also carries the most recently
    used category_id for that description, so the UI can prefill the category.
    """
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])

    try:
        days = int(request.args.get("days", 90))
        limit = int(request.args.get("limit", 10))
    except ValueError:
        return jsonify({"error": "days and limit must be integers"}), 400

    days = max(1, min(days, 365))
    limit = max(1, min(limit, 50))

    cutoff = (datetime.now(UTC) - timedelta(days=days)).date()
    prefix = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"

    session = db.get_session()
    try:
        freq_stmt = (
            select(
                SpendingEntry.description,
                func.count(SpendingEntry.id).label("frequency"),
            )
            .where(SpendingEntry.description.ilike(prefix, escape="\\"))
            .where(SpendingEntry.spent_date >= cutoff)
            .group_by(SpendingEntry.description)
            .order_by(desc("frequency"), SpendingEntry.description)
            .limit(limit)
        )
        freq_rows = session.execute(freq_stmt).all()
        if not freq_rows:
            return jsonify([])

        descriptions = [row.description for row in freq_rows]

        # Most-recent category per description (only over entries in window).
        rn = (
            func.row_number()
            .over(
                partition_by=SpendingEntry.description,
                order_by=(desc(SpendingEntry.spent_date), desc(SpendingEntry.id)),
            )
            .label("rn")
        )
        latest_subq = (
            select(SpendingEntry.description, SpendingEntry.category_id, rn)
            .where(SpendingEntry.description.in_(descriptions))
            .where(SpendingEntry.spent_date >= cutoff)
            .subquery()
        )
        latest_stmt = select(
            latest_subq.c.description, latest_subq.c.category_id
        ).where(latest_subq.c.rn == 1)
        latest_by_desc = {
            row.description: row.category_id
            for row in session.execute(latest_stmt).all()
        }

        suggestions = [
            SpendingDescriptionSuggestion(
                description=row.description,
                frequency=row.frequency,
                last_category_id=latest_by_desc.get(row.description),
            ).model_dump(mode="json")
            for row in freq_rows
        ]
        return jsonify(suggestions)
    finally:
        session.close()


@spending_bp.route("/spending", methods=["GET"])
def list_all_spending():
    """List all spending entries across every pay period (used by the Insights dashboard)."""
    session = db.get_session()
    try:
        entries = session.query(SpendingEntry).all()
        result = [
            SpendingEntryResponse.model_validate(entry).model_dump(mode="json")
            for entry in entries
        ]
        return jsonify(result)
    finally:
        session.close()


@spending_bp.route("/pay-periods/<int:pay_period_id>/spending", methods=["GET"])
def list_spending(pay_period_id: int):
    """List all spending entries for a pay period."""
    session = db.get_session()
    try:
        pay_period = session.query(PayPeriod).filter_by(id=pay_period_id).first()
        if not pay_period:
            return jsonify({"error": "Pay period not found"}), 404

        result = [
            SpendingEntryResponse.model_validate(entry).model_dump(mode="json")
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
        return jsonify({"error": json.loads(e.json())}), 400

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

        result = SpendingEntryResponse.model_validate(entry).model_dump(mode="json")
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
        return jsonify({"error": json.loads(e.json())}), 400

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

        result = SpendingEntryResponse.model_validate(entry).model_dump(mode="json")
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
