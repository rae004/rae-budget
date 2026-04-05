from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import BillTemplate, PayPeriod, PayPeriodBill


def get_next_pay_date(from_date: date) -> date:
    """
    Calculate next pay date (6th or 20th, Friday if weekend).

    Pay dates are on the 6th and 20th of each month.
    If the pay date falls on a weekend, it moves to the preceding Friday.
    """
    year = from_date.year
    month = from_date.month
    day = from_date.day

    # Determine the next pay date
    if day < 6:
        pay_date = date(year, month, 6)
    elif day < 20:
        pay_date = date(year, month, 20)
    else:
        # Move to the 6th of next month
        pay_date = date(year + 1, 1, 6) if month == 12 else date(year, month + 1, 6)

    # Adjust for weekends (Saturday=5, Sunday=6)
    return adjust_for_weekend(pay_date)


def adjust_for_weekend(pay_date: date) -> date:
    """If the date falls on a weekend, move to the preceding Friday."""
    weekday = pay_date.weekday()
    if weekday == 5:  # Saturday
        return pay_date - timedelta(days=1)
    elif weekday == 6:  # Sunday
        return pay_date - timedelta(days=2)
    return pay_date


def get_pay_period_end_date(start_date: date) -> date:
    """
    Calculate the end date for a pay period.

    The end date is the day before the next pay date.
    """
    year = start_date.year
    month = start_date.month
    day = start_date.day

    # Determine the next pay date after this one
    if day <= 6:
        # Current is around 6th, next is around 20th
        next_pay = date(year, month, 20)
    elif day <= 20:
        # Current is around 20th, next is 6th of next month
        next_pay = date(year + 1, 1, 6) if month == 12 else date(year, month + 1, 6)
    else:
        # After 20th, shouldn't happen but handle it
        next_pay = date(year + 1, 1, 6) if month == 12 else date(year, month + 1, 6)

    # Adjust for weekend
    next_pay = adjust_for_weekend(next_pay)

    # End date is day before next pay date
    return next_pay - timedelta(days=1)


def calculate_bill_total(pay_period: PayPeriod) -> Decimal:
    """Calculate the total of all bills for a pay period."""
    return sum((bill.amount for bill in pay_period.bills), Decimal("0"))


def calculate_spending_total(pay_period: PayPeriod) -> Decimal:
    """Calculate the total of all spending entries for a pay period."""
    return sum((entry.amount for entry in pay_period.spending_entries), Decimal("0"))


def calculate_running_total(pay_period: PayPeriod) -> Decimal:
    """Calculate the running total (bills + spending)."""
    return calculate_bill_total(pay_period) + calculate_spending_total(pay_period)


def calculate_remaining(pay_period: PayPeriod) -> Decimal:
    """Calculate remaining balance (income + additional - running total)."""
    income = pay_period.actual_income or pay_period.expected_income
    additional = pay_period.additional_income or Decimal("0")
    return income + additional - calculate_running_total(pay_period)


def calculate_bill_due_date(
    due_day: int,
    period_start: date,
    period_end: date,
) -> date | None:
    """
    Calculate the actual due date for a bill within a pay period.

    Handles:
    - Pay periods spanning month boundaries (e.g., Dec 20 - Jan 5)
    - Months with fewer days than due_day (e.g., due_day=31 in February)

    Returns the due date if it falls within the pay period, None otherwise.
    """
    # Check start month
    year, month = period_start.year, period_start.month
    max_day = monthrange(year, month)[1]
    actual_day = min(due_day, max_day)
    candidate = date(year, month, actual_day)

    if period_start <= candidate <= period_end:
        return candidate

    # Check end month (if different from start month)
    if period_end.month != period_start.month or period_end.year != period_start.year:
        year, month = period_end.year, period_end.month
        max_day = monthrange(year, month)[1]
        actual_day = min(due_day, max_day)
        candidate = date(year, month, actual_day)

        if period_start <= candidate <= period_end:
            return candidate

    return None


def repopulate_bills_from_templates(session: Session, pay_period: PayPeriod) -> dict:
    """
    Re-populate bills for a pay period from templates.

    Deletes existing template-based bills and re-creates them using the
    current due date filtering logic. Preserves manually-added bills
    (those without a bill_template_id).

    Returns a dict with counts of deleted and created bills.
    """
    # Delete existing template-based bills (preserve manual bills)
    template_bills = [b for b in pay_period.bills if b.bill_template_id is not None]
    deleted_count = len(template_bills)
    for bill in template_bills:
        session.delete(bill)

    # Flush to ensure deletes are processed before re-creating
    session.flush()

    # Re-create bills from templates using new logic
    new_bills = create_bills_from_templates(session, pay_period)
    for bill in new_bills:
        session.add(bill)

    return {
        "deleted": deleted_count,
        "created": len(new_bills),
    }


def create_bills_from_templates(
    session: Session, pay_period: PayPeriod
) -> list[PayPeriodBill]:
    """
    Create bills from recurring templates that fall within this pay period.

    Only bills whose due_day_of_month falls within the pay period's date range
    are created. Templates without a due_day_of_month are skipped.

    Returns list of created PayPeriodBill objects.
    """
    templates = (
        session.query(BillTemplate)
        .filter(
            BillTemplate.is_recurring == True  # noqa: E712
        )
        .all()
    )

    bills = []
    for template in templates:
        # Skip templates without a due day
        if not template.due_day_of_month:
            continue

        # Calculate actual due date for this pay period
        due_date = calculate_bill_due_date(
            template.due_day_of_month,
            pay_period.start_date,
            pay_period.end_date,
        )

        # Only create bill if due date falls within pay period
        if due_date:
            bill = PayPeriodBill(
                pay_period_id=pay_period.id,
                bill_template_id=template.id,
                name=template.name,
                amount=template.default_amount,
                due_date=due_date,
                is_paid=False,
            )
            bills.append(bill)

    return bills
