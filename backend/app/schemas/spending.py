from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SpendingEntryBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    amount: Decimal = Field(..., ge=0)
    spent_date: date
    category_id: int | None = None
    notes: str | None = Field(None, max_length=500)


class SpendingEntryCreate(SpendingEntryBase):
    pass


class SpendingEntryUpdate(BaseModel):
    description: str | None = Field(None, min_length=1, max_length=500)
    amount: Decimal | None = Field(None, ge=0)
    spent_date: date | None = None
    category_id: int | None = None
    notes: str | None = Field(None, max_length=500)


class SpendingEntryResponse(SpendingEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pay_period_id: int
    created_at: datetime
    updated_at: datetime
