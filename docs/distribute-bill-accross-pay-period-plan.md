# Fix: Auto-assign Bills by Due Date

## Problem
When creating a pay period, ALL recurring bill templates are copied regardless of due date. This causes:
- Bills total to show monthly sum instead of pay period sum
- Running total too high
- Remaining balance too low

## Solution
Only populate bills whose `due_day_of_month` falls within the pay period's date range.

---

## Implementation Steps

### Step 1: Update Bill Population Logic

**File:** `backend/app/services/pay_period_service.py`

Modify `create_bills_from_templates()` to filter by due date:

```python
def create_bills_from_templates(
    db: Session,
    pay_period: PayPeriod
) -> list[PayPeriodBill]:
    """Create bills from recurring templates that fall within this pay period."""
    templates = db.query(BillTemplate).filter(
        BillTemplate.is_recurring == True
    ).all()

    bills = []
    for template in templates:
        # Calculate actual due date for this pay period
        due_date = calculate_bill_due_date(
            template.due_day_of_month,
            pay_period.start_date,
            pay_period.end_date
        )

        # Only create bill if due date falls within pay period
        if due_date and pay_period.start_date <= due_date <= pay_period.end_date:
            bill = PayPeriodBill(
                pay_period_id=pay_period.id,
                bill_template_id=template.id,
                name=template.name,
                amount=template.default_amount,
                due_date=due_date,
                is_paid=False
            )
            bills.append(bill)

    return bills
```

### Step 2: Add Due Date Calculation Helper

**File:** `backend/app/services/pay_period_service.py`

```python
def calculate_bill_due_date(
    due_day: int,
    period_start: date,
    period_end: date
) -> date | None:
    """
    Calculate the actual due date for a bill within a pay period.

    Handles:
    - Pay periods spanning month boundaries (e.g., Dec 20 - Jan 5)
    - Months with fewer days than due_day (e.g., due_day=31 in February)
    """
    from calendar import monthrange

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
```

### Step 3: Update Tests

**File:** `backend/tests/test_pay_period_service.py`

Add tests for the new due date logic:

```python
def test_bill_due_date_in_first_pay_period():
    """Bill due on 1st should only appear in pay period containing the 1st."""
    # Pay period: Apr 1-5
    # Bill due: 1st
    # Expected: Due date Apr 1

def test_bill_due_date_in_second_pay_period():
    """Bill due on 15th should only appear in pay period containing the 15th."""
    # Pay period: Apr 6-19
    # Bill due: 15th
    # Expected: Due date Apr 15

def test_bill_due_date_spanning_months():
    """Pay period spanning months should include bills from both months."""
    # Pay period: Dec 20 - Jan 5
    # Bill due: 25th → Dec 25
    # Bill due: 1st → Jan 1

def test_bill_due_date_short_month():
    """Bills due on 31st should adjust for short months."""
    # Pay period: Feb 20 - Mar 5
    # Bill due: 31st in Feb → Feb 28/29
```

### Step 4: Data Migration Consideration

For existing pay periods with incorrect bills, provide options:

1. **Manual cleanup** - User deletes incorrect bills manually
2. **Re-populate endpoint** - Add API endpoint to re-populate bills for a pay period
3. **Bulk fix script** - One-time script to fix all existing pay periods

**Recommended:** Add a "Re-populate bills" button in the UI that:
- Deletes current bills for the pay period
- Re-creates bills using the new logic
- Preserves any manual bill entries (those without `bill_template_id`)

---

## Files to Modify

| File | Changes |
|------|---------|
| `backend/app/services/pay_period_service.py` | Add `calculate_bill_due_date()`, update `create_bills_from_templates()` |
| `backend/tests/test_pay_period_service.py` | Add tests for due date calculation |
| `backend/app/routes/pay_periods.py` | (Optional) Add re-populate endpoint |

---

## Edge Cases Handled

1. **Pay period spans two months** (e.g., Dec 20 - Jan 5)
   - Check both months for matching due dates

2. **Short months** (e.g., Feb has 28/29 days)
   - Bills due on 29/30/31 adjusted to last day of month

3. **Bills due on pay period boundary** (e.g., due on 6th, pay period starts 6th)
   - Inclusive check: `start <= due_date <= end`

4. **No matching due date**
   - Bill simply not created for that pay period

---

## Verification

```bash
# Run updated tests
docker compose exec api uv run pytest tests/test_pay_period_service.py -v

# Manual verification:
# 1. Create a new pay period (Apr 6-19)
# 2. Verify only bills due 6th-19th are populated
# 3. Create another pay period (Apr 20 - May 5)
# 4. Verify bills due 20th-31st AND 1st-5th are included
```
