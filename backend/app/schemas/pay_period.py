from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PayPeriodBase(BaseModel):
    start_date: date
    end_date: date
    expected_income: Decimal = Field(Decimal("0"), ge=0)
    actual_income: Decimal | None = Field(None, ge=0)
    additional_income: Decimal | None = Field(None, ge=0)
    additional_income_description: str | None = Field(None, max_length=200)
    notes: str | None = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_dates(self) -> "PayPeriodBase":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be >= start_date")
        return self


class PayPeriodCreate(PayPeriodBase):
    pass


class PayPeriodUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    expected_income: Decimal | None = Field(None, ge=0)
    actual_income: Decimal | None = Field(None, ge=0)
    additional_income: Decimal | None = Field(None, ge=0)
    additional_income_description: str | None = Field(None, max_length=200)
    notes: str | None = Field(None, max_length=500)


class PayPeriodSummary(BaseModel):
    """Calculated summary for a pay period."""

    bill_total: Decimal
    spending_total: Decimal
    running_total: Decimal
    remaining: Decimal


class PayPeriodResponse(PayPeriodBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class PayPeriodDetailResponse(PayPeriodResponse):
    """Pay period with calculated totals."""

    summary: PayPeriodSummary
