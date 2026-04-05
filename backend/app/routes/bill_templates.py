from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.extensions import db
from app.models import BillTemplate
from app.schemas import (
    BillTemplateCreate,
    BillTemplateResponse,
    BillTemplateUpdate,
)

bill_templates_bp = Blueprint("bill_templates", __name__)


@bill_templates_bp.route("/bill-templates", methods=["GET"])
def list_bill_templates():
    """List all bill templates."""
    session = db.get_session()
    try:
        templates = session.query(BillTemplate).order_by(BillTemplate.name).all()
        result = [
            BillTemplateResponse.model_validate(t).model_dump(mode="json") for t in templates
        ]
        return jsonify(result)
    finally:
        session.close()


@bill_templates_bp.route("/bill-templates/<int:template_id>", methods=["GET"])
def get_bill_template(template_id: int):
    """Get a single bill template."""
    session = db.get_session()
    try:
        template = session.query(BillTemplate).filter_by(id=template_id).first()
        if not template:
            return jsonify({"error": "Bill template not found"}), 404

        result = BillTemplateResponse.model_validate(template).model_dump(mode="json")
        return jsonify(result)
    finally:
        session.close()


@bill_templates_bp.route("/bill-templates", methods=["POST"])
def create_bill_template():
    """Create a new bill template."""
    try:
        data = BillTemplateCreate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    session = db.get_session()
    try:
        template = BillTemplate(
            name=data.name,
            default_amount=data.default_amount,
            due_day_of_month=data.due_day_of_month,
            is_recurring=data.is_recurring,
            category_id=data.category_id,
            notes=data.notes,
        )
        session.add(template)
        session.commit()
        session.refresh(template)

        result = BillTemplateResponse.model_validate(template).model_dump(mode="json")
        return jsonify(result), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@bill_templates_bp.route("/bill-templates/<int:template_id>", methods=["PUT"])
def update_bill_template(template_id: int):
    """Update a bill template."""
    try:
        data = BillTemplateUpdate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    session = db.get_session()
    try:
        template = session.query(BillTemplate).filter_by(id=template_id).first()
        if not template:
            return jsonify({"error": "Bill template not found"}), 404

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(template, key, value)

        session.commit()
        session.refresh(template)

        result = BillTemplateResponse.model_validate(template).model_dump(mode="json")
        return jsonify(result)
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@bill_templates_bp.route("/bill-templates/<int:template_id>", methods=["DELETE"])
def delete_bill_template(template_id: int):
    """Delete a bill template."""
    session = db.get_session()
    try:
        template = session.query(BillTemplate).filter_by(id=template_id).first()
        if not template:
            return jsonify({"error": "Bill template not found"}), 404

        session.delete(template)
        session.commit()

        return "", 204
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
