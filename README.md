# Rae Budget

Personal budget tracking application built with Flask and React.

## Tech Stack

- **Backend**: Flask 3.x, SQLAlchemy 2.x, PostgreSQL 17
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, DaisyUI
- **Package Management**: UV (Python), npm (Node)

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for frontend development)

## Quick Start

1. **Clone and configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
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

## Development

### Backend

The Flask backend runs in Docker. To run linting:

```bash
cd backend
uv run ruff check .
```

### Frontend

```bash
cd frontend
npm run dev     # Start dev server
npm run build   # Production build
npm run lint    # Run ESLint
```

## Project Structure

```
rae-budget/
├── backend/
│   ├── app/
│   │   ├── models/      # SQLAlchemy models
│   │   └── routes/      # API endpoints
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   └── package.json
├── db/
│   └── init/            # Database initialization scripts
├── docker-compose.yml
└── .env
```
