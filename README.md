# Rae Budget

[![CI](https://github.com/rae004/rae-budget/actions/workflows/ci.yml/badge.svg)](https://github.com/rae004/rae-budget/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/rae004/rae-budget/branch/main/graph/badge.svg)](https://codecov.io/gh/rae004/rae-budget)
[![Release](https://github.com/rae004/rae-budget/actions/workflows/release-please.yml/badge.svg)](https://github.com/rae004/rae-budget/actions/workflows/release-please.yml)
[![Version](https://img.shields.io/github/package-json/v/rae004/rae-budget?filename=frontend%2Fpackage.json&color=blue&label=version)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Node.js](https://img.shields.io/badge/Node-22-brightgreen?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Personal budget tracking application for managing pay periods, bills, and spending.

## Features

- **Pay Period Management**: Track budgets per pay period (6th and 20th of each month)
- **Automatic Date Calculation**: Pay dates adjust to Friday if they fall on a weekend
- **Additional Income**: Add one-time additional income per pay period (bonuses, side income, etc.)
- **Bill Tracking**: Add bills with due dates, mark as paid, inline editing
- **Auto-assign Bills**: Recurring bills are automatically assigned to pay periods based on due date
- **Bill Templates**: Create reusable templates for recurring bills with due day of month
- **Spending Tracking**: Log daily spending with categories, inline editing, and running totals
- **Real-time Calculations**: Automatic totals for bills, spending, and remaining balance
- **Categories**: Full CRUD on the Settings page with safe-delete (delete-in-use returns a confirmation modal showing affected bills/spending; force-delete uncategorizes them via DB cascade)
- **Data Management**: Export all data to JSON, import from backup, or reset all data
- **Settings Page**: Manage categories, run data exports/imports/resets

## Tech Stack

- **Backend**: Flask 3.x, SQLAlchemy 2.x, Pydantic 2.x, PostgreSQL 17
- **Frontend**: React 19, TypeScript, TanStack Query, Vite, TailwindCSS 4.x, DaisyUI 5.x
- **Package Management**: UV (Python), npm (Node)
- **Development**: Docker Compose, Ruff (linting), ESLint

## Prerequisites

- Docker and Docker Compose
- Node.js 22+ (for frontend development)

## Quick Start

1. **Clone and configure environment**
   ```bash
   cp .env.example .env
   ```

2. **Start services**
   ```bash
   docker compose up -d
   ```

3. **Verify backend is running**
   ```bash
   curl http://localhost:5000/api/health
   ```

4. **Start frontend development server**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - API: http://localhost:5000/api

## API Endpoints

### Pay Periods

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pay-periods` | List all pay periods |
| GET | `/api/pay-periods/:id` | Get pay period with summary |
| GET | `/api/pay-periods/suggest` | Get suggested next pay period dates |
| POST | `/api/pay-periods` | Create pay period |
| POST | `/api/pay-periods?populate_bills=true` | Create with bills from templates |
| PUT | `/api/pay-periods/:id` | Update pay period |
| DELETE | `/api/pay-periods/:id` | Delete pay period |
| POST | `/api/pay-periods/:id/repopulate-bills` | Re-assign bills from templates |
| POST | `/api/pay-periods/repopulate-all-bills` | Re-assign bills for all pay periods |

### Bills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pay-periods/:id/bills` | List bills for pay period |
| POST | `/api/pay-periods/:id/bills` | Add bill to pay period |
| PUT | `/api/bills/:id` | Update bill (amount, paid status) |
| DELETE | `/api/bills/:id` | Delete bill |

### Spending

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pay-periods/:id/spending` | List spending entries |
| POST | `/api/pay-periods/:id/spending` | Add spending entry |
| PUT | `/api/spending/:id` | Update spending entry |
| DELETE | `/api/spending/:id` | Delete spending entry |

### Bill Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bill-templates` | List all templates |
| POST | `/api/bill-templates` | Create template |
| PUT | `/api/bill-templates/:id` | Update template |
| DELETE | `/api/bill-templates/:id` | Delete template |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:id` | Get a single category |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category. Returns **409** with usage counts if referenced by bills/spending. Pass `?force=true` to delete anyway (DB FK is `ON DELETE SET NULL`, so referencing rows become uncategorized). |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (status + database connectivity) |

### Data Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data/export` | Export all data as JSON |
| POST | `/api/data/import` | Import data from JSON |
| DELETE | `/api/data/reset` | Delete all data (requires confirmation header) |

## Development

### Backend

```bash
# Run in Docker
docker compose exec api uv run ruff check .      # Lint
docker compose exec api uv run ruff format .     # Format
docker compose exec api uv run pytest -v         # Test

# Or locally with UV
cd backend
uv sync --all-extras
uv run ruff check .
uv run pytest -v
```

### Frontend

```bash
cd frontend
npm run dev             # Start dev server
npm run build           # Production build
npm run lint            # Run ESLint
npm test                # Run Vitest tests
npm run test:coverage   # Run Vitest with coverage report
npx tsc --noEmit        # Type check
```

## Project Structure

```
rae-budget/
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy models
│   │   ├── routes/       # API endpoints
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   ├── tests/            # Pytest tests (~94% coverage)
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/   # React components (each with co-located *.test.tsx)
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # TanStack Query hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client (ApiError-aware)
│   │   ├── test/         # Vitest setup + shared render helpers
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Date helpers, etc.
│   └── package.json
├── db/
│   └── init/             # Database initialization (raw SQL)
├── docs/                 # Historical implementation plans
├── scripts/              # Local CI helpers
├── .github/
│   └── workflows/        # ci.yml + release-please.yml
├── docker-compose.yml
├── release-please-config.json
├── .release-please-manifest.json
├── CHANGELOG.md
├── LICENSE
└── .env.example
```

## Releases & Versioning

Versions are managed automatically by [release-please](https://github.com/googleapis/release-please) based on [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` → minor bump
- `fix:` → patch bump
- `feat!:` or `BREAKING CHANGE:` → major bump
- `chore:`, `docs:`, `test:`, `ci:`, `style:`, `refactor:`, `build:`, `perf:` → no bump

When commits land on `main`, release-please opens a release PR that bumps both `frontend/package.json` and `backend/pyproject.toml` (kept in lockstep) and prepends a CHANGELOG section. Merging that PR creates the git tag (`vX.Y.Z`) and a GitHub Release.

## Pay Period Logic

Pay periods follow a semi-monthly schedule:
- **Pay Dates**: 6th and 20th of each month
- **Weekend Adjustment**: If pay date falls on Saturday or Sunday, it moves to the preceding Friday
- **Period End**: Day before the next pay date

Example:
- Pay date: April 6th (Sunday) → Adjusted to April 4th (Friday)
- Period: April 4th - April 17th (day before April 18th, the adjusted 20th)

## Database Schema

### Tables

- `pay_periods` - Budget tracking periods with expected/actual/additional income (and optional description for additional income)
- `bill_templates` - Reusable bill definitions with due day of month
- `pay_period_bills` - Bills assigned to pay periods (auto-assigned or manual)
- `spending_entries` - Individual spending transactions with categories
- `categories` - Spending categories with colors

### Default Categories

The database is seeded with common spending categories:
- Housing, Utilities, Food, Transportation
- Healthcare, Entertainment, Shopping
- Personal, Savings, Other

These can be edited or removed in the Settings page.
