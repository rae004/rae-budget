# CLAUDE.md — Agent context for the rae-budget repo

This file is loaded automatically by Claude Code in this repository. It captures everything a fresh agent (or one running on a different machine) needs to be productive without re-discovering the project state.

---

## What this is

**Rae Budget** is a personal full-stack budget tracking app: pay periods (semi-monthly, 6th and 20th), bills, spending, categories, with running totals and remaining-balance math. Single-user, runs locally via Docker Compose. Owner: Robert Engel (`rae004@gmail.com`).

GitHub: <https://github.com/rae004/rae-budget>

---

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Python 3.13, Flask 3, SQLAlchemy 2 (sync), Pydantic 2, Alembic, uv |
| Frontend | React 19, TypeScript 5, Vite 6, TailwindCSS 4, DaisyUI 5, TanStack Query 5, React Router 7 |
| Database | PostgreSQL 17 |
| Tests | pytest + pytest-cov (backend), Vitest + @testing-library/react (frontend) |
| Lint/format | Ruff (backend), ESLint (frontend) |
| Local dev | Docker Compose |
| CI | GitHub Actions, runs on `pull_request` AND `push: main`; uploads to Codecov (flagged `backend` / `frontend`) |
| Releases | release-please (Conventional Commits → auto version bumps + tags + GitHub Releases) |

---

## Repo layout

```
rae-budget/
├── backend/                          # Flask API
│   ├── app/                          # Application code
│   │   ├── extensions.py             # SQLAlchemy Base + Database wrapper (sync, no Flask-SQLAlchemy)
│   │   ├── models/                   # SQLAlchemy 2.x models (Mapped/mapped_column)
│   │   ├── routes/                   # Flask blueprints (one per resource)
│   │   ├── schemas/                  # Pydantic 2 schemas (request/response shapes)
│   │   └── services/                 # Business logic (calculations, bill auto-assign, etc.)
│   ├── alembic/                      # Schema migrations — see "Migrations" below
│   │   ├── env.py                    # Reads DATABASE_URL from env, imports Base + models
│   │   └── versions/                 # Migration files
│   ├── alembic.ini
│   ├── scripts/migrate.py            # Auto-stamps legacy DBs, runs `upgrade head`
│   ├── tests/                        # pytest tests (94% coverage)
│   ├── entrypoint.sh                 # Runs migrate.py before flask run
│   ├── Dockerfile
│   └── pyproject.toml                # uv-managed deps; version is owned by release-please
├── frontend/
│   ├── src/
│   │   ├── components/               # React components (each with co-located *.test.tsx)
│   │   ├── contexts/                 # ToastContext (only context so far)
│   │   ├── hooks/                    # TanStack Query hooks (one file per resource)
│   │   ├── pages/                    # Route components
│   │   ├── services/api.ts           # fetch wrapper; throws ApiError with status + body
│   │   ├── test/                     # Vitest setup + shared render helpers
│   │   ├── types/                    # TypeScript types (mirror backend response shapes)
│   │   └── utils/                    # Date helpers (timezone-aware)
│   └── package.json                  # version owned by release-please
├── docs/                             # Implementation plans (historical reference)
├── scripts/                          # Local CI helpers (e.g., scripts/ci-local.sh)
├── .github/workflows/
│   ├── ci.yml                        # Lint + test + build + Codecov upload
│   └── release-please.yml            # Auto-release management
├── docker-compose.yml                # `api` + `postgres` services
├── release-please-config.json        # Synced versions across both packages
├── .release-please-manifest.json     # Current released version (truth source)
├── CHANGELOG.md                      # Owned by release-please
├── LICENSE                           # Apache-2.0
└── README.md
```

---

## Running locally

```bash
# 1. Env file (one-time)
cp .env.example .env

# 2. Start everything
docker compose up -d

# 3. Frontend dev server (separate terminal)
cd frontend
npm install   # postinstall script runs `npm rebuild rollup` automatically
npm run dev

# URLs
# Frontend: http://localhost:5173
# API:      http://localhost:5000/api
# Health:   http://localhost:5000/api/health
```

Default Postgres credentials in `.env.example`: user `rae_budget`, password `localdev123`, db `rae_budget`.

---

## Running tests

### Backend (153 tests, ~94% coverage)

```bash
docker compose exec api uv run pytest tests/ -v
docker compose exec api uv run pytest tests/ --cov=app --cov-report=term
```

Tests use **in-memory SQLite** via `Base.metadata.create_all` in `conftest.py` — they do **not** touch Postgres or Alembic.

### Frontend (125 tests, ~87% coverage)

```bash
cd frontend
npm test
npm run test:coverage
```

If you see `Cannot find module @rollup/rollup-<platform>`, the postinstall script should have prevented it but: `cd frontend && npm install` (re-run) or `rm -rf node_modules package-lock.json && npm install` as the heavy hammer. See "Gotchas" below.

---

## Migrations (Alembic)

**Schema is managed by Alembic.** The legacy `db/init/01_init.sql` is gone.

### How it works

- `backend/alembic/versions/` holds revision files
- On every container start, `entrypoint.sh` runs `scripts/migrate.py`, which:
  - Detects pre-existing schemas (legacy DBs) and auto-stamps them at baseline
  - Then runs `alembic upgrade head` (no-op if already at head)
- `env.py` reads `DATABASE_URL` from environment

### Adding a migration when you change a model

```bash
# 1. Edit the model in backend/app/models/
# 2. Generate the migration
docker compose exec api alembic revision --autogenerate -m "describe change"
# 3. REVIEW the generated file in backend/alembic/versions/
#    (autogenerate misses CheckConstraints, raw SQL, etc.)
# 4. Apply
docker compose restart api
```

### Useful Alembic commands

```bash
docker compose exec api alembic current        # what version am I on?
docker compose exec api alembic history        # show all revisions
docker compose exec api alembic downgrade -1   # roll back one
docker compose exec api alembic upgrade head   # apply pending
```

### When generating a baseline against the running DB

The running DB already has the schema, so `--autogenerate` against it sees zero diffs. To generate a "what would create this from scratch" migration, point Alembic at an empty DB:

```bash
docker compose exec postgres psql -U rae_budget -d rae_budget -c "CREATE DATABASE alembic_temp;"
docker compose exec -e DATABASE_URL="postgresql+psycopg://rae_budget:localdev123@postgres:5432/alembic_temp" api alembic revision --autogenerate -m "..."
docker compose exec postgres psql -U rae_budget -d rae_budget -c "DROP DATABASE alembic_temp;"
```

---

## Releases & versioning (release-please)

The frontend (`package.json`) and backend (`pyproject.toml`) versions are **kept in lockstep** by release-please. A single tag `vX.Y.Z` covers the whole repo.

### Conventional Commit prefixes

| Prefix | Bump | Example |
|---|---|---|
| `feat:` | minor | `feat: add category management` |
| `fix:` | patch | `fix: handle null amount in spending form` |
| `feat!:` / `BREAKING CHANGE:` footer | major | `feat!: drop /api/v0/health` |
| `chore:`, `docs:`, `test:`, `ci:`, `style:`, `refactor:`, `perf:`, `build:` | none (silent) | `test: add CategoryManagement.test.tsx` |

### Release flow

1. Conventional commits land on `main` (via merged PRs)
2. `release-please.yml` opens (or updates) a "release PR" titled `chore(main): release X.Y.Z` that bumps both version files + prepends a CHANGELOG entry
3. Merging that release PR triggers the workflow again, which creates the tag `vX.Y.Z` + a GitHub Release

**You never write release commits manually.** release-please does it.

### When commits aren't conventional

The user uses **merge commits** (not squash) for PRs. release-please reads every individual commit on main, so commits inside PRs need to be conventional. If a commit's prefix is non-conventional, release-please silently ignores it for version-bump purposes.

---

## CI/CD

`.github/workflows/ci.yml` triggers on `pull_request` AND `push: main`. Jobs:

| Job | What it does |
|---|---|
| Backend Lint | Ruff check + format check |
| Backend Tests | pytest with coverage; uploads to Codecov flagged `backend` |
| Frontend Lint | ESLint |
| Frontend Tests | Vitest with coverage; uploads to Codecov flagged `frontend` |
| Frontend Build | tsc --noEmit + vite build |

`CODECOV_TOKEN` repo secret is required for uploads.

`.github/workflows/release-please.yml` triggers on `push: main` and runs the release-please action.

---

## Conventions and patterns

### Backend

- **No Flask-SQLAlchemy.** Plain SQLAlchemy 2.x with `app/extensions.py` exposing `db.get_session()`. Each route opens a session in a `try/finally`.
- **Pydantic schemas** for request validation and response serialization. Schemas live in `app/schemas/`. Routes call `Schema.model_validate(request.json)`; on `ValidationError` return `400` with `{"error": json.loads(e.json())}` (NOT `e.errors()` — that fails to serialize when `model_validator` raises ValueError).
- **Categories DELETE** returns `409 {"error": "in_use", "bill_templates": N, "spending_entries": M}` if the category is referenced. Pass `?force=true` to delete anyway (DB FK is `ON DELETE SET NULL`).
- **Sample fixtures** in `backend/tests/conftest.py`: `client`, `session`, `sample_category`, `sample_pay_period`, `sample_bill_template`, `sample_bill`, `sample_spending`. Tests using SQLAlchemy fixture objects must capture `obj.id` BEFORE making a request — the route closes the test's session in its `finally` block, detaching the fixture object.

### Frontend

- **DaisyUI 5** removed the `form-control` class. Use explicit `flex flex-col` to stack labels above inputs.
- **`ApiError`** in `src/services/api.ts` — fetch wrapper throws this with `status` + `body` instead of plain `Error`. Callers can `if (error instanceof ApiError && error.status === 409)` to branch on HTTP status without string-matching messages. `ApiError extends Error` so all existing `error instanceof Error` checks still pass.
- **TanStack Query keys** are scoped per resource (see `categoryKeys`, `payPeriodKeys`, etc. in each hook file). Mutations invalidate related lists and details.
- **Tests** wrap with `QueryClientProvider` + `ToastProvider` (same pattern across all `*.test.tsx` files). Mock `fetch` globally with `vi.stubGlobal`. For async queries on mount, use `await screen.findBy*` instead of `getBy*`.
- **Forms with select dropdowns**: data loads async. The first interaction needs a `findByRole` to wait for the query, not `getByRole` (which would crash before the option exists).

### Database / migrations

- Models live in `backend/app/models/`. Each declares `__tablename__`. Indexes go in `__table_args__` as `Index(...)` tuples so autogenerate keeps them in sync.
- All FKs use explicit `ondelete` behavior — `CASCADE` for owning relationships (pay_period → bills/spending), `SET NULL` for soft references (category → bills/spending).
- `updated_at` is set by SQLAlchemy via `onupdate=lambda: datetime.now(UTC)`. There are no DB-side triggers in the new schema.

---

## Gotchas

### Rollup native binary mismatch (`Cannot find module @rollup/rollup-<platform>`)

Long-standing npm bug ([npm/cli#4828](https://github.com/npm/cli/issues/4828)). Rollup uses platform-specific `optionalDependencies`; npm sometimes installs the wrong one when the lockfile was generated on a different arch.

**Mitigation in place**: `frontend/package.json` has `"postinstall": "npm rebuild rollup"`. Forces npm to fetch the right native binary for the current platform on every install.

**Failure mode**: even with the postinstall, if the user's terminal is in **Rosetta (x86_64)** but the npm install was done from a native ARM session, the wrong binary is on disk. Fix: re-run `npm install` from the affected terminal. Real fix: get the user out of Rosetta (Terminal Get Info → uncheck "Open using Rosetta").

### Backend `.venv` corruption (historical)

The Dockerfile puts the venv at **`/opt/venv`** (not `/app/.venv`) so the bind-mount of `./backend:/app` can't shadow or corrupt it. If you see the container restart loop with `/app/.venv/bin/flask: cannot execute`, that means someone ran `uv` on the host and poisoned `backend/.venv`. Fix: `rm -rf backend/.venv` and restart the container. **But** this should never happen with the current Dockerfile — only if someone reverts `UV_PROJECT_ENVIRONMENT=/opt/venv`.

### Pydantic `ValidationError` serialization

Pydantic 2 puts the raw `ValueError` instance in `ctx.error` of `e.errors()` when a `model_validator(mode="after")` raises. Flask's `jsonify` can't serialize it → 500 instead of 400. **All routes use `json.loads(e.json())`** instead. If you add a new route with Pydantic validation, follow the same pattern.

### Test fixtures and session detachment

The test session is the same object the route uses (patched via `db.get_session = lambda: session` in conftest). The route closes it in `finally`, which detaches all fixture objects. **Always capture `fixture.id` into a local variable BEFORE the request:**

```python
def test_something(client, sample_category):
    cat_id = sample_category.id  # capture before request
    response = client.post(..., json={"category_id": cat_id})
    # don't access sample_category.foo here — it's detached
```

---

## Current state (as of last session)

- **Frontend coverage**: ~87% (125 tests, all passing)
- **Backend coverage**: ~94% (153 tests, all passing)
- **Last open PR**: #15 — `feat: replace SQL init with Alembic schema migrations`. Adds the entire Alembic infrastructure described above. Pushed but not yet merged when this file was written.
- **Latest released version on main**: 0.1.3. Next release will be 0.2.0 (driven by the Alembic `feat:`).

To check current PR state: `gh pr list --state all --head <branch> --limit 5`. Always verify before pushing — assuming a PR is still open after a merge has bitten the user before.

---

## User preferences

These come from accumulated feedback. Honor them by default.

- **Be concise.** Short answers; no repetition or decorative tables. Lead with the answer or fix in 1–3 sentences. Don't pre-emptively dump a tradeoff comparison; ask "want more detail?" if useful.
- **Don't push squash-merge.** User uses merge commits. Their in-PR commits are conventional, so release-please reads them fine.
- **Don't deflect blame.** When something breaks, accept it as "ours" and pivot to the fix. Skip forensic arguments to prove I didn't cause it, even if technically right.
- **Verify PR state before referencing it.** Don't say "pushed to PR #N" without confirming #N is still open. The user merges quickly; old PRs may be closed/merged when you push next.
- **User prefers to run Docker commands themselves** in some cases. If they say "I'll run that" — wait for them.

---

## Suggested first actions for a fresh agent

1. `gh pr list --state open` — see what's in flight
2. `git log --oneline origin/main -10` — see recent merged work
3. `docker compose ps` — see if containers are up
4. `docker compose logs api --tail 30` — verify the API is healthy
5. `cd frontend && npm test 2>&1 | tail -5` — confirm the FE test setup works (will trigger postinstall if first run)

If the API container is in a restart loop, check `docker compose logs api` first — usually it's the legacy `.venv` corruption gotcha (see above).
