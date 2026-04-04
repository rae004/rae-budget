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
    """Calculate remaining balance (income - running total)."""
    income = pay_period.actual_income or pay_period.expected_income
    return income - calculate_running_total(pay_period)


def create_bills_from_templates(
    session: Session, pay_period: PayPeriod
) -> list[PayPeriodBill]:
    """
    Create bills for a pay period from active bill templates.

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
        # Calculate due date if template has a due day
        due_date = None
        if template.due_day_of_month:
            try:
                due_date = date(
                    pay_period.start_date.year,
                    pay_period.start_date.month,
                    template.due_day_of_month,
                )
                # If due date is before pay period, try next month
                if due_date < pay_period.start_date:
                    month = pay_period.start_date.month + 1
                    year = pay_period.start_date.year
                    if month > 12:
                        month = 1
                        year += 1
                    due_date = date(year, month, template.due_day_of_month)
            except ValueError:
                # Invalid day for month (e.g., Feb 30)
                due_date = None

        bill = PayPeriodBill(
            pay_period_id=pay_period.id,
            bill_template_id=template.id,
            name=template.name,
            amount=template.default_amount,
            due_date=due_date,
        )
        bills.append(bill)

    return bills
