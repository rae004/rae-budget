# Rae Budget Tracker - Implementation Plan

## Project Overview

A pay period budget tracking application that replicates the functionality of the existing Excel spreadsheet, with a React frontend, Python Flask API, and PostgreSQL database.

### Key Features (based on Excel analysis)
- **Pay Period Management**: Track spending per pay period (paid on 6th and 20th, Friday if weekend)
- **Two-Section Layout**:
  1. **Bills Section**: Fixed recurring bills (Rent, Utilities, Spectrum, Verizon, Duke Power, Progressive, etc.) with amount, due date, and paid status
  2. **Additional Monthly Spending**: Variable expenses (restaurants, groceries, gas, subscriptions, etc.) with From/vendor, Date, Amount, Note, and running Total
- **Summary Calculations**:
  - Pay Period Bill Total (sum of bills)
  - Running Pay Period Total (bills + additional spending)
  - Additional Income (Bonus) with optional notes like "rollover"
  - Pay Check amount
  - Remaining for Pay Period (PayCheck + Bonus - Running Total)
- **Future expansion**: Categories and analytics/reporting

---

## Architecture

```
rae-budget/
├── frontend/                    # React application (runs on host via nvm/node 24+)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── jest.config.js
│   └── .eslintrc.js
├── backend/                     # Python Flask API
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── db/                          # Database
│   ├── init/
│   │   └── 01_init.sql
│   └── migrations/
├── docker-compose.yml
└── README.md
```

---

## Phase 1: Project Foundation

### 1.1 Docker & Database Setup
**Files to create:**
- `docker-compose.yml` - PostgreSQL 17 + Flask API services
- `db/init/01_init.sql` - Initial schema creation
- `.env.example` - Environment variable template

**Database Schema:**
```sql
-- Pay periods table
CREATE TABLE pay_periods (
    id SERIAL PRIMARY KEY,
    pay_date DATE NOT NULL UNIQUE,
    paycheck_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    additional_income DECIMAL(10,2) DEFAULT 0,
    additional_income_note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill templates (recurring bills)
CREATE TABLE bill_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    default_amount DECIMAL(10,2),
    typical_due_day INTEGER,  -- day of month (1-31)
    is_estimate BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills for each pay period
CREATE TABLE pay_period_bills (
    id SERIAL PRIMARY KEY,
    pay_period_id INTEGER REFERENCES pay_periods(id) ON DELETE CASCADE,
    bill_template_id INTEGER REFERENCES bill_templates(id),
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    is_estimate BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional spending entries
CREATE TABLE spending_entries (
    id SERIAL PRIMARY KEY,
    pay_period_id INTEGER REFERENCES pay_periods(id) ON DELETE CASCADE,
    vendor VARCHAR(100) NOT NULL,  -- "From" column in Excel
    amount DECIMAL(10,2) NOT NULL,
    spent_date DATE,
    note VARCHAR(255),
    category_id INTEGER REFERENCES categories(id),  -- for future analytics
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories for future analytics
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7),  -- hex color for UI
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_pay_periods_date ON pay_periods(pay_date);
CREATE INDEX idx_spending_entries_period ON spending_entries(pay_period_id);
CREATE INDEX idx_pay_period_bills_period ON pay_period_bills(pay_period_id);
```

### 1.2 Backend Setup (Flask + UV)
**Files to create:**
- `backend/pyproject.toml` - UV project config with dependencies
- `backend/Dockerfile` - Multi-stage build with UV
- `backend/.python-version` - Python 3.13
- `backend/app/__init__.py` - Flask app factory
- `backend/app/config.py` - Configuration management
- `backend/ruff.toml` - Ruff linting config
- `backend/mypy.ini` - MyPy static analysis config

**Key Dependencies:**
- Flask 3.x
- Flask-CORS
- SQLAlchemy 2.x (with psycopg3)
- Pydantic 2.x
- pytest, pytest-cov

### 1.3 Frontend Setup (React + Vite)
**Files to create:**
- `frontend/package.json` - Dependencies and scripts
- `frontend/vite.config.ts` - Vite configuration
- `frontend/tsconfig.json` - TypeScript config
- `frontend/.eslintrc.js` - ESLint + Prettier config
- `frontend/jest.config.js` - Jest testing config
- `frontend/tailwind.config.js` - Tailwind + DaisyUI config

**Key Dependencies:**
- React 19.x
- TypeScript 5.x
- @tanstack/react-query 5.x
- @tanstack/react-form 1.x
- daisyui 5.x (with Tailwind CSS 4.x)
- jest, @testing-library/react

---

## Phase 2: Backend API Implementation

### 2.1 Models (SQLAlchemy)
**Files to create:**
- `backend/app/models/pay_period.py`
- `backend/app/models/bill_template.py`
- `backend/app/models/pay_period_bill.py`
- `backend/app/models/spending_entry.py`
- `backend/app/models/category.py`

### 2.2 Pydantic Schemas
**Files to create:**
- `backend/app/schemas/pay_period.py`
- `backend/app/schemas/bill.py`
- `backend/app/schemas/spending.py`
- `backend/app/schemas/category.py`

### 2.3 API Routes
**Files to create:**
- `backend/app/routes/pay_periods.py`
  - `GET /api/pay-periods` - List all pay periods
  - `GET /api/pay-periods/:id` - Get single pay period with bills and spending
  - `POST /api/pay-periods` - Create new pay period
  - `PUT /api/pay-periods/:id` - Update pay period (paycheck, bonus)
  - `DELETE /api/pay-periods/:id` - Delete pay period

- `backend/app/routes/bills.py`
  - `GET /api/pay-periods/:id/bills` - Get bills for pay period
  - `POST /api/pay-periods/:id/bills` - Add bill to pay period
  - `PUT /api/bills/:id` - Update bill (amount, paid status)
  - `DELETE /api/bills/:id` - Remove bill

- `backend/app/routes/spending.py`
  - `GET /api/pay-periods/:id/spending` - Get spending for pay period
  - `POST /api/pay-periods/:id/spending` - Add spending entry
  - `PUT /api/spending/:id` - Update spending entry
  - `DELETE /api/spending/:id` - Remove spending entry

- `backend/app/routes/bill_templates.py`
  - `GET /api/bill-templates` - Get all bill templates
  - `POST /api/bill-templates` - Create template
  - `PUT /api/bill-templates/:id` - Update template
  - `DELETE /api/bill-templates/:id` - Delete template

### 2.4 Business Logic Services
**Files to create:**
- `backend/app/services/pay_period_service.py`
  - Calculate bill total
  - Calculate running total (bills + spending)
  - Calculate remaining balance
  - Auto-generate next pay period dates (6th/20th logic with weekend adjustment)
  - Auto-populate bills from templates when creating new pay period

### 2.5 Backend Tests
**Files to create:**
- `backend/tests/conftest.py` - Test fixtures
- `backend/tests/test_pay_periods.py`
- `backend/tests/test_bills.py`
- `backend/tests/test_spending.py`
- `backend/tests/test_calculations.py`

---

## Phase 3: Frontend Implementation

### 3.1 Core Setup & Types
**Files to create:**
- `frontend/src/types/index.ts` - TypeScript interfaces
- `frontend/src/services/api.ts` - API client configuration
- `frontend/src/main.tsx` - App entry with QueryClientProvider
- `frontend/src/App.tsx` - Root component with routing

### 3.2 API Hooks (TanStack Query)
**Files to create:**
- `frontend/src/hooks/usePayPeriods.ts`
- `frontend/src/hooks/useBills.ts`
- `frontend/src/hooks/useSpending.ts`
- `frontend/src/hooks/useBillTemplates.ts`

### 3.3 Components
**Files to create:**
- `frontend/src/components/PayPeriodSelector.tsx` - Dropdown/tabs to select pay period
- `frontend/src/components/BillsTable.tsx` - Bills section with paid checkboxes
- `frontend/src/components/SpendingTable.tsx` - Additional spending with running total
- `frontend/src/components/SummaryCard.tsx` - Pay period summary (totals, remaining)
- `frontend/src/components/AddBillForm.tsx` - TanStack Form for adding bills
- `frontend/src/components/AddSpendingForm.tsx` - TanStack Form for adding spending
- `frontend/src/components/PayPeriodForm.tsx` - Create/edit pay period

### 3.4 Pages
**Files to create:**
- `frontend/src/pages/Dashboard.tsx` - Main view (current pay period)
- `frontend/src/pages/PayPeriodDetail.tsx` - Single pay period view
- `frontend/src/pages/BillTemplates.tsx` - Manage recurring bill templates
- `frontend/src/pages/Settings.tsx` - App settings (future: categories)

### 3.5 Layout & Theme
**Files to create:**
- `frontend/src/components/Layout.tsx` - Main layout with navigation
- `frontend/src/components/Navbar.tsx` - Navigation bar
- `frontend/index.html` - HTML template with DaisyUI theme

### 3.6 Frontend Tests
**Files to create:**
- `frontend/src/__tests__/components/BillsTable.test.tsx`
- `frontend/src/__tests__/components/SpendingTable.test.tsx`
- `frontend/src/__tests__/hooks/usePayPeriods.test.ts`

---

## Phase 4: Integration & Polish

### 4.1 Calculations (matching Excel formulas)
- **Pay Period Bill Total** = SUM of all bills in the pay period
- **Running Pay Period Total** = Bill Total + SUM of all spending entries
- **Remaining for Pay Period** = PayCheck + Additional Income - Running Total

### 4.2 Pay Period Date Logic
```python
def get_next_pay_date(from_date: date) -> date:
    """Calculate next pay date (6th or 20th, Friday if weekend)"""
    # If before the 6th, next pay is the 6th
    # If between 6th and 20th, next pay is the 20th
    # If after the 20th, next pay is the 6th of next month
    # Adjust to Friday if Saturday/Sunday
```

### 4.3 Documentation
**Files to create:**
- `README.md` - Setup instructions, development workflow
- `backend/README.md` - API documentation

---

## Verification Plan

### Local Development Setup Test
1. Clone repo and run `docker compose up -d` (starts Postgres + Flask API)
2. Run `cd frontend && npm install && npm run dev` (starts React dev server)
3. Access http://localhost:5173 - verify UI loads
4. Access http://localhost:5000/api/health - verify API responds

### Functional Tests
1. **Create Pay Period**: Create a new pay period for the next pay date
2. **Add Bills**: Add recurring bills (Rent, Utilities, etc.) and mark as paid
3. **Add Spending**: Add multiple spending entries with vendors and amounts
4. **Verify Calculations**: Confirm totals match expected values
5. **Navigate**: Switch between pay periods, verify data persists

### Automated Tests
```bash
# Backend
cd backend && uv run pytest -v

# Frontend
cd frontend && npm test
```

### Code Quality
```bash
# Backend linting
cd backend && uv run ruff check . && uv run mypy .

# Frontend linting
cd frontend && npm run lint
```

---

## Technology Versions

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | 24.x | Managed by nvm (user has installed) |
| React | 19.x | Latest stable |
| TypeScript | 5.x | Latest stable |
| TanStack Query | 5.x | Latest stable |
| TanStack Form | 1.x | Latest stable |
| DaisyUI | 5.x | Latest with Tailwind 4.x |
| Tailwind CSS | 4.x | Latest stable |
| Python | 3.13 | Latest stable |
| Flask | 3.x | Latest stable |
| SQLAlchemy | 2.x | Latest stable with async support |
| Pydantic | 2.x | Latest stable |
| PostgreSQL | 17 | Current stable |
| UV | Latest | For Python version/package management |
| Ruff | Latest | Python linting/formatting |

---

## Implementation Order

1. **Docker/Database setup** - Foundation for everything
2. **Backend skeleton** - Flask app with health check
3. **Database models** - SQLAlchemy models
4. **API routes** - CRUD operations
5. **Frontend skeleton** - React + Vite + DaisyUI
6. **API integration** - TanStack Query hooks
7. **Core UI** - Dashboard, forms, tables
8. **Calculations** - Business logic matching Excel
9. **Testing** - Unit and integration tests
10. **Polish** - Error handling, loading states, UX improvements
