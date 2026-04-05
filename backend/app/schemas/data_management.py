"""Pydantic schemas for data export/import/reset operations."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class CategoryExport(BaseModel):
    """Category data for export (excludes id and timestamps)."""

    name: str
    description: str | None
    color: str


class BillTemplateExport(BaseModel):
    """Bill template data for export (excludes id and timestamps)."""

    name: str
    default_amount: Decimal
    due_day_of_month: int | None
    is_recurring: bool
    category_name: str | None  # Use name instead of id for portability
    notes: str | None


class PayPeriodBillExport(BaseModel):
    """Pay period bill data for export (excludes id and timestamps)."""

    name: str
    amount: Decimal
    due_date: date | None
    is_paid: bool
    paid_date: date | None
    notes: str | None
    bill_template_name: str | None  # Use name instead of id for portability


class SpendingEntryExport(BaseModel):
    """Spending entry data for export (excludes id and timestamps)."""

    description: str
    amount: Decimal
    spent_date: date
    category_name: str | None  # Use name instead of id for portability
    notes: str | None


class PayPeriodExport(BaseModel):
    """Pay period data with nested bills and spending entries."""

    start_date: date
    end_date: date
    expected_income: Decimal
    actual_income: Decimal | None
    notes: str | None
    bills: list[PayPeriodBillExport]
    spending_entries: list[SpendingEntryExport]


class DataExportData(BaseModel):
    """The data portion of an export."""

    categories: list[CategoryExport]
    bill_templates: list[BillTemplateExport]
    pay_periods: list[PayPeriodExport]


class DataExport(BaseModel):
    """Full export structure with metadata."""

    export_version: str = "1.0"
    export_date: datetime
    data: DataExportData


class DataImport(BaseModel):
    """Import structure matching export format."""

    export_version: str = Field(..., pattern=r"^\d+\.\d+$")
    export_date: datetime
    data: DataExportData


class ImportResult(BaseModel):
    """Result of an import operation."""

    categories_created: int
    categories_skipped: int
    bill_templates_created: int
    bill_templates_skipped: int
    pay_periods_created: int
    bills_created: int
    spending_entries_created: int


class ResetResult(BaseModel):
    """Result of a reset operation."""

    categories_deleted: int
    bill_templates_deleted: int
    pay_periods_deleted: int
    bills_deleted: int
    spending_entries_deleted: int
