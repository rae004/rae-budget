from flask import Flask

from app.routes.bill_templates import bill_templates_bp
from app.routes.bills import bills_bp
from app.routes.categories import categories_bp
from app.routes.health import health_bp
from app.routes.pay_periods import pay_periods_bp
from app.routes.spending import spending_bp


def register_blueprints(app: Flask) -> None:
    """Register all blueprints with the Flask app."""
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(pay_periods_bp, url_prefix="/api")
    app.register_blueprint(bills_bp, url_prefix="/api")
    app.register_blueprint(spending_bp, url_prefix="/api")
    app.register_blueprint(bill_templates_bp, url_prefix="/api")
    app.register_blueprint(categories_bp, url_prefix="/api")
