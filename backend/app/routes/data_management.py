"""Data management routes for export, import, and reset operations."""

from datetime import UTC, datetime

from flask import Blueprint, Response, jsonify, request
from pydantic import ValidationError

from app.extensions import db
from app.models import (
    BillTemplate,
    Category,
    PayPeriod,
    PayPeriodBill,
    SpendingEntry,
)
from app.schemas.data_management import (
    BillTemplateExport,
    CategoryExport,
    DataExport,
    DataExportData,
    DataImport,
    ImportResult,
    PayPeriodBillExport,
    PayPeriodExport,
    ResetResult,
    SpendingEntryExport,
)

data_management_bp = Blueprint("data_management", __name__)


@data_management_bp.route("/data/export", methods=["GET"])
def export_data():
    """Export all user data as a JSON file."""
    session = db.get_session()
    try:
        # Query all categories
        categories = session.query(Category).order_by(Category.name).all()
        category_exports = [
            CategoryExport(
                name=c.name,
                description=c.description,
                color=c.color,
            )
            for c in categories
        ]

        # Build category id -> name mapping
        category_id_to_name = {c.id: c.name for c in categories}

        # Query all bill templates
        bill_templates = session.query(BillTemplate).order_by(BillTemplate.name).all()
        bill_template_exports = [
            BillTemplateExport(
                name=bt.name,
                default_amount=bt.default_amount,
                due_day_of_month=bt.due_day_of_month,
                is_recurring=bt.is_recurring,
                category_name=category_id_to_name.get(bt.category_id),
                notes=bt.notes,
            )
            for bt in bill_templates
        ]

        # Build bill template id -> name mapping
        bill_template_id_to_name = {bt.id: bt.name for bt in bill_templates}

        # Query all pay periods with nested data
        pay_periods = (
            session.query(PayPeriod).order_by(PayPeriod.start_date.desc()).all()
        )
        pay_period_exports = []
        for pp in pay_periods:
            # Export bills for this pay period
            bills = [
                PayPeriodBillExport(
                    name=b.name,
                    amount=b.amount,
                    due_date=b.due_date,
                    is_paid=b.is_paid,
                    paid_date=b.paid_date,
                    notes=b.notes,
                    bill_template_name=bill_template_id_to_name.get(b.bill_template_id),
                )
                for b in pp.bills
            ]

            # Export spending entries for this pay period
            spending_entries = [
                SpendingEntryExport(
                    description=se.description,
                    amount=se.amount,
                    spent_date=se.spent_date,
                    category_name=category_id_to_name.get(se.category_id),
                    notes=se.notes,
                )
                for se in pp.spending_entries
            ]

            pay_period_exports.append(
                PayPeriodExport(
                    start_date=pp.start_date,
                    end_date=pp.end_date,
                    expected_income=pp.expected_income,
                    actual_income=pp.actual_income,
                    notes=pp.notes,
                    bills=bills,
                    spending_entries=spending_entries,
                )
            )

        # Build the export structure
        export = DataExport(
            export_version="1.0",
            export_date=datetime.now(UTC),
            data=DataExportData(
                categories=category_exports,
                bill_templates=bill_template_exports,
                pay_periods=pay_period_exports,
            ),
        )

        # Return as JSON with download headers
        response = Response(
            export.model_dump_json(indent=2),
            mimetype="application/json",
            headers={
                "Content-Disposition": "attachment; filename=rae-budget-export.json"
            },
        )
        return response
    finally:
        session.close()


@data_management_bp.route("/data/import", methods=["POST"])
def import_data():
    """Import data from a previously exported JSON file."""
    try:
        data = DataImport.model_validate(request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    session = db.get_session()
    try:
        # Track import counts
        categories_created = 0
        categories_skipped = 0
        bill_templates_created = 0
        bill_templates_skipped = 0
        pay_periods_created = 0
        bills_created = 0
        spending_entries_created = 0

        # Step 1: Import categories (by name, skip if exists)
        category_name_to_id: dict[str, int] = {}

        # First, load existing categories
        existing_categories = session.query(Category).all()
        for c in existing_categories:
            category_name_to_id[c.name] = c.id

        # Then, import new categories
        for cat_data in data.data.categories:
            if cat_data.name in category_name_to_id:
                categories_skipped += 1
            else:
                category = Category(
                    name=cat_data.name,
                    description=cat_data.description,
                    color=cat_data.color,
                )
                session.add(category)
                session.flush()  # Get the ID
                category_name_to_id[category.name] = category.id
                categories_created += 1

        # Step 2: Import bill templates (by name, skip if exists)
        bill_template_name_to_id: dict[str, int] = {}

        # First, load existing bill templates
        existing_templates = session.query(BillTemplate).all()
        for bt in existing_templates:
            bill_template_name_to_id[bt.name] = bt.id

        # Then, import new bill templates
        for bt_data in data.data.bill_templates:
            if bt_data.name in bill_template_name_to_id:
                bill_templates_skipped += 1
            else:
                category_id = None
                if bt_data.category_name:
                    category_id = category_name_to_id.get(bt_data.category_name)

                bill_template = BillTemplate(
                    name=bt_data.name,
                    default_amount=bt_data.default_amount,
                    due_day_of_month=bt_data.due_day_of_month,
                    is_recurring=bt_data.is_recurring,
                    category_id=category_id,
                    notes=bt_data.notes,
                )
                session.add(bill_template)
                session.flush()
                bill_template_name_to_id[bill_template.name] = bill_template.id
                bill_templates_created += 1

        # Step 3: Import pay periods (always create new)
        for pp_data in data.data.pay_periods:
            pay_period = PayPeriod(
                start_date=pp_data.start_date,
                end_date=pp_data.end_date,
                expected_income=pp_data.expected_income,
                actual_income=pp_data.actual_income,
                notes=pp_data.notes,
            )
            session.add(pay_period)
            session.flush()
            pay_periods_created += 1

            # Import bills for this pay period
            for bill_data in pp_data.bills:
                bill_template_id = None
                if bill_data.bill_template_name:
                    bill_template_id = bill_template_name_to_id.get(
                        bill_data.bill_template_name
                    )

                bill = PayPeriodBill(
                    pay_period_id=pay_period.id,
                    bill_template_id=bill_template_id,
                    name=bill_data.name,
                    amount=bill_data.amount,
                    due_date=bill_data.due_date,
                    is_paid=bill_data.is_paid,
                    paid_date=bill_data.paid_date,
                    notes=bill_data.notes,
                )
                session.add(bill)
                bills_created += 1

            # Import spending entries for this pay period
            for se_data in pp_data.spending_entries:
                category_id = None
                if se_data.category_name:
                    category_id = category_name_to_id.get(se_data.category_name)

                spending_entry = SpendingEntry(
                    pay_period_id=pay_period.id,
                    category_id=category_id,
                    description=se_data.description,
                    amount=se_data.amount,
                    spent_date=se_data.spent_date,
                    notes=se_data.notes,
                )
                session.add(spending_entry)
                spending_entries_created += 1

        session.commit()

        result = ImportResult(
            categories_created=categories_created,
            categories_skipped=categories_skipped,
            bill_templates_created=bill_templates_created,
            bill_templates_skipped=bill_templates_skipped,
            pay_periods_created=pay_periods_created,
            bills_created=bills_created,
            spending_entries_created=spending_entries_created,
        )

        return jsonify(result.model_dump()), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@data_management_bp.route("/data/reset", methods=["DELETE"])
def reset_data():
    """Delete all user data. Requires confirmation header."""
    # Check for confirmation header
    confirm_header = request.headers.get("X-Confirm-Reset")
    if confirm_header != "DELETE-ALL-DATA":
        return (
            jsonify(
                {
                    "error": "Reset requires X-Confirm-Reset header with value 'DELETE-ALL-DATA'"
                }
            ),
            400,
        )

    session = db.get_session()
    try:
        # Count items before deletion
        categories_count = session.query(Category).count()
        bill_templates_count = session.query(BillTemplate).count()
        pay_periods_count = session.query(PayPeriod).count()
        bills_count = session.query(PayPeriodBill).count()
        spending_entries_count = session.query(SpendingEntry).count()

        # Delete in order respecting foreign key constraints
        # Pay period bills and spending entries are deleted via cascade
        # when pay periods are deleted
        session.query(PayPeriodBill).delete()
        session.query(SpendingEntry).delete()
        session.query(PayPeriod).delete()
        session.query(BillTemplate).delete()
        session.query(Category).delete()

        session.commit()

        result = ResetResult(
            categories_deleted=categories_count,
            bill_templates_deleted=bill_templates_count,
            pay_periods_deleted=pay_periods_count,
            bills_deleted=bills_count,
            spending_entries_deleted=spending_entries_count,
        )

        return jsonify(result.model_dump()), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
