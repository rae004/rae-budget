#!/bin/bash
set -e

cd /app

# Apply database migrations (auto-stamps pre-existing schemas as baseline)
python scripts/migrate.py

# Hand off to whatever was passed as CMD
exec "$@"
