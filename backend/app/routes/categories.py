import json

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.extensions import db
from app.models import BillTemplate, Category, SpendingEntry
from app.schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/categories", methods=["GET"])
def list_categories():
    """List all categories."""
    session = db.get_session()
    try:
        categories = session.query(Category).order_by(Category.name).all()
        result = [
            CategoryResponse.model_validate(c).model_dump(mode="json")
            for c in categories
        ]
        return jsonify(result)
    finally:
        session.close()


@categories_bp.route("/categories/<int:category_id>", methods=["GET"])
def get_category(category_id: int):
    """Get a single category."""
    session = db.get_session()
    try:
        category = session.query(Category).filter_by(id=category_id).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404

        result = CategoryResponse.model_validate(category).model_dump(mode="json")
        return jsonify(result)
    finally:
        session.close()


@categories_bp.route("/categories", methods=["POST"])
def create_category():
    """Create a new category."""
    try:
        data = CategoryCreate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": json.loads(e.json())}), 400

    session = db.get_session()
    try:
        category = Category(
            name=data.name,
            description=data.description,
            color=data.color,
            monthly_target=data.monthly_target,
        )
        session.add(category)
        session.commit()
        session.refresh(category)

        result = CategoryResponse.model_validate(category).model_dump(mode="json")
        return jsonify(result), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@categories_bp.route("/categories/<int:category_id>", methods=["PUT"])
def update_category(category_id: int):
    """Update a category."""
    try:
        data = CategoryUpdate.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": json.loads(e.json())}), 400

    session = db.get_session()
    try:
        category = session.query(Category).filter_by(id=category_id).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(category, key, value)

        session.commit()
        session.refresh(category)

        result = CategoryResponse.model_validate(category).model_dump(mode="json")
        return jsonify(result)
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@categories_bp.route("/categories/<int:category_id>", methods=["DELETE"])
def delete_category(category_id: int):
    """Delete a category.

    By default, returns 409 if the category is referenced by any bill templates
    or spending entries. Pass ?force=true to delete anyway — the database FK is
    ON DELETE SET NULL, so referencing rows become uncategorized.
    """
    force = request.args.get("force", "").lower() == "true"

    session = db.get_session()
    try:
        category = session.query(Category).filter_by(id=category_id).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404

        if not force:
            bill_templates_count = (
                session.query(BillTemplate).filter_by(category_id=category_id).count()
            )
            spending_entries_count = (
                session.query(SpendingEntry).filter_by(category_id=category_id).count()
            )
            if bill_templates_count > 0 or spending_entries_count > 0:
                return jsonify(
                    {
                        "error": "in_use",
                        "bill_templates": bill_templates_count,
                        "spending_entries": spending_entries_count,
                    }
                ), 409

        session.delete(category)
        session.commit()

        return "", 204
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
