"""Run Alembic migrations, stamping pre-existing schemas as baseline first.

This handles both fresh installs and existing databases:
  - Fresh install: no tables exist → alembic upgrade head creates everything.
  - Pre-existing DB (originally provisioned by db/init/01_init.sql before this
    project adopted Alembic): tables exist but no alembic_version table →
    stamp baseline first so Alembic considers the DB already-at-baseline,
    then run upgrade head as a no-op (or apply any later migrations).
"""

import os
import sys

from alembic.config import Config
from sqlalchemy import create_engine, inspect

from alembic import command


def main() -> None:
    cfg = Config("alembic.ini")
    db_url = os.environ["DATABASE_URL"]
    cfg.set_main_option("sqlalchemy.url", db_url)

    engine = create_engine(db_url)
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    has_app_tables = bool(table_names & {"categories", "pay_periods"})
    has_alembic_version = "alembic_version" in table_names

    if has_app_tables and not has_alembic_version:
        print(
            "[migrate] Pre-existing schema detected; stamping baseline...",
            flush=True,
        )
        command.stamp(cfg, "head")

    print("[migrate] alembic upgrade head", flush=True)
    command.upgrade(cfg, "head")


if __name__ == "__main__":
    sys.exit(main() or 0)
