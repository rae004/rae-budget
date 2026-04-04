from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import create_app
from app.config import TestingConfig
from app.extensions import Base, db
from app.models import BillTemplate, Category, PayPeriod, PayPeriodBill, SpendingEntry


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app(TestingConfig)
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def session(app):
    """Create database session for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Patch the db to use our test session
    original_get_session = db.get_session
    db.get_session = lambda: session

    yield session

    db.get_session = original_get_session
    session.close()
    engine.dispose()


@pytest.fixture
def sample_category(session):
    """Create a sample category."""
    category = Category(
        name="Food",
        description="Food and dining",
        color="#f59e0b",
    )
    session.add(category)
    session.commit()
    return category


@pytest.fixture
def sample_pay_period(session):
    """Create a sample pay period."""
    pay_period = PayPeriod(
        start_date=date(2026, 4, 6),
        end_date=date(2026, 4, 19),
        expected_income=Decimal("2500.00"),
    )
    session.add(pay_period)
    session.commit()
    return pay_period


@pytest.fixture
def sample_bill_template(session):
    """Create a sample bill template."""
    template = BillTemplate(
        name="Rent",
        default_amount=Decimal("1500.00"),
        due_day_of_month=1,
        is_recurring=True,
    )
    session.add(template)
    session.commit()
    return template


@pytest.fixture
def sample_bill(session, sample_pay_period, sample_bill_template):
    """Create a sample pay period bill."""
    bill = PayPeriodBill(
        pay_period_id=sample_pay_period.id,
        bill_template_id=sample_bill_template.id,
        name="Rent",
        amount=Decimal("1500.00"),
        due_date=date(2026, 4, 1),
        is_paid=False,
    )
    session.add(bill)
    session.commit()
    return bill


@pytest.fixture
def sample_spending(session, sample_pay_period, sample_category):
    """Create a sample spending entry."""
    entry = SpendingEntry(
        pay_period_id=sample_pay_period.id,
        category_id=sample_category.id,
        description="Groceries at Publix",
        amount=Decimal("150.00"),
        spent_date=date(2026, 4, 8),
    )
    session.add(entry)
    session.commit()
    return entry
