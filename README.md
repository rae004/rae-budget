# Rae Budget

Personal budget tracking application for managing pay periods, bills, and spending.

## Features

- **Pay Period Management**: Track budgets per pay period (6th and 20th of each month)
- **Automatic Date Calculation**: Pay dates adjust to Friday if they fall on a weekend
- **Bill Tracking**: Add bills with due dates, mark as paid, use templates for recurring bills
- **Spending Tracking**: Log daily spending with categories and running totals
- **Real-time Calculations**: Automatic totals for bills, spending, and remaining balance
- **Bill Templates**: Create reusable templates for recurring bills

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
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

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
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Run ESLint
npx tsc --noEmit   # Type check
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
│   ├── tests/            # Pytest tests
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # TanStack Query hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   └── package.json
├── db/
│   └── init/             # Database initialization
├── .github/
│   └── workflows/        # CI/CD workflows
├── docker-compose.yml
└── .env
```

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

- `pay_periods` - Budget tracking periods with income
- `bill_templates` - Reusable bill definitions
- `pay_period_bills` - Bills assigned to pay periods
- `spending_entries` - Individual spending transactions
- `categories` - Spending categories with colors

### Default Categories

The database is seeded with common spending categories:
- Food & Dining, Groceries, Gas & Fuel
- Entertainment, Shopping, Utilities
- Healthcare, Transportation, Other
