from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BillTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    default_amount: Decimal = Field(..., ge=0)
    due_day_of_month: int | None = Field(None, ge=1, le=31)
    is_recurring: bool = True
    category_id: int | None = None
    notes: str | None = Field(None, max_length=500)


class BillTemplateCreate(BillTemplateBase):
    pass


class BillTemplateUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    default_amount: Decimal | None = Field(None, ge=0)
    due_day_of_month: int | None = Field(None, ge=1, le=31)
    is_recurring: bool | None = None
    category_id: int | None = None
    notes: str | None = Field(None, max_length=500)


class BillTemplateResponse(BillTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class PayPeriodBillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    amount: Decimal = Field(..., ge=0)
    due_date: date | None = None
    is_paid: bool = False
    paid_date: date | None = None
    notes: str | None = Field(None, max_length=500)


class PayPeriodBillCreate(PayPeriodBillBase):
    bill_template_id: int | None = None


class PayPeriodBillUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    amount: Decimal | None = Field(None, ge=0)
    due_date: date | None = None
    is_paid: bool | None = None
    paid_date: date | None = None
    notes: str | None = Field(None, max_length=500)


class PayPeriodBillResponse(PayPeriodBillBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pay_period_id: int
    bill_template_id: int | None
    created_at: datetime
    updated_at: datetime
