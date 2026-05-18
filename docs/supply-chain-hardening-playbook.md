# Supply-Chain Hardening Playbook

A phase-by-phase guide for another agent (or engineer) to harden a similar full-stack web app against npm/PyPI supply-chain attacks. Distilled from the rae-budget hardening session (May 2026) in response to the mini-Shai-Hulud TanStack compromise.

---

## Audience and assumptions

This playbook targets apps that look roughly like:

- Single repository, small-to-medium scale
- Python or Node.js backend (this playbook covers Python with `uv`; adapt the commands for `pip`/`poetry`/`pdm` as needed)
- JavaScript/TypeScript frontend (this playbook covers React via Vite, but the patterns apply to any npm/pnpm/yarn app)
- GitHub Actions for CI
- Either no Dependabot or a minimally-configured Dependabot
- A `gh` CLI with repo write access available

If your app differs substantially (monorepo, polyglot, on-prem CI), use this as a reference rather than a literal script.

---

## Why this order

The phases below are sequenced deliberately. Each builds on guarantees the previous one established. Re-ordering creates avoidable conflicts:

1. **Workflow + intake controls first.** Without locked-down permissions and a Dependabot config, you can't safely process the wave of update PRs that follow.
2. **Wave processing second.** Once Dependabot is configured, expect 5-15 PRs within minutes of the config landing. Handle them as a batch before adding more rules.
3. **Cadence controls third.** Only after you've seen one full wave can you tune cooldowns and group splits intelligently.
4. **Install-time hardening last.** Migrating package managers or flipping audits to blocking is risky if the baseline isn't already green.

---

## Phase 0: Pre-flight audit

**Goal:** Know your starting position so changes don't surprise you.

**Steps:**

1. Read `.github/workflows/*.yml`. Note: which Actions are referenced, whether `permissions:` blocks exist, whether SHAs or version tags are used.
2. Check for `dependabot.yml`. Note: ecosystems covered, current `open-pull-requests-limit`, any existing groups.
3. Check lockfile status:
   ```bash
   ls frontend/package-lock.json frontend/pnpm-lock.yaml backend/uv.lock backend/poetry.lock 2>/dev/null
   grep -E "\.lock$|package-lock" .gitignore
   ```
   A lockfile that's `.gitignore`d but exists locally means CI is re-resolving every run — that's a finding.
4. Survey direct dependency version specifiers:
   ```bash
   grep -E '"\\^|"\\~' frontend/package.json
   ```
   Caret/tilde ranges aren't a vulnerability on their own (lockfile pins resolved versions) but they're a foot-gun if anyone deletes the lockfile.
5. Run a baseline audit so you know what's already known-bad:
   ```bash
   cd frontend && npm audit --json | jq '.metadata.vulnerabilities'
   cd backend && uvx pip-audit
   ```

**Output of this phase:** a one-page mental model of the current attack surface. Don't change anything yet.

---

## Phase 1: Workflow + intake foundation (single PR)

**Goal:** Establish defense-in-depth at the workflow level and turn on the intake pipeline.

This is one PR, not five. The pieces are interdependent: the audit jobs aren't useful without tracked lockfiles, lockfile tracking isn't useful without Dependabot to keep it fresh, and so on.

**Branch:** `hardening-supply-chain` (or similar). Branch off `main`.

### 1.1 Lock workflow permissions

For every workflow file:

```yaml
# Top of the file, before `jobs:`
permissions:
  contents: read
```

For workflows that *must* write (release automation, label bots, etc.): keep the workflow-level block read-only and add a per-job `permissions:` block with only the writes that specific job needs. Example for a release-please workflow:

```yaml
permissions:
  contents: read

jobs:
  release-please:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: googleapis/release-please-action@<SHA>  # vN
```

**Why:** the default `GITHUB_TOKEN` carries write permissions. A compromised dependency with a postinstall script can use it to push commits, modify issues, or exfiltrate via webhook. Read-only neutralizes that vector.

### 1.2 SHA-pin every third-party Action

For each `uses:` of a non-`actions/*`-owned action (and arguably even `actions/*` since GitHub the company itself can be compromised), replace the version tag with a full commit SHA and preserve the tag as a comment:

```yaml
# Before
- uses: codecov/codecov-action@v5

# After
- uses: codecov/codecov-action@75cd11691c0faa626561e295848008c8a7dddffe  # v5
```

**Get the SHA programmatically:**
```bash
gh api repos/<owner>/<repo>/git/ref/tags/<tag> --jq '{type: .object.type, sha: .object.sha}'
```

If `type` is `"tag"` (annotated tag), peel one more step:
```bash
gh api repos/<owner>/<repo>/git/tags/<sha> --jq '.object.sha'
```

**Why:** GitHub tags are mutable. The March 2025 `tj-actions/changed-files` compromise worked by force-moving the `v45` tag to point at a malicious commit; everyone who pinned to `v45` got the malicious code on next run. SHAs are immutable.

**Important:** preserve the human-readable tag as a trailing comment. Without it, future you (or Dependabot) can't tell what version is actually pinned.

### 1.3 Add Dependabot config

Create `.github/dependabot.yml`. Starting template covering the common ecosystems:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /frontend  # or / if your package.json is at root
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 8
    groups:
      # Group framework deps together so they update in lockstep
      tanstack:
        patterns: ["@tanstack/*"]
      react:
        patterns:
          - "react"
          - "react-dom"
          - "react-router-dom"
          - "@types/react"
          - "@types/react-dom"
      # Split test/tooling into FOCUSED groups -- not a single "tooling"
      # umbrella, or a Vitest 4 breaking change will block 10 other harmless
      # patch bumps in the same PR
      eslint:
        patterns:
          - "eslint"
          - "eslint-*"
          - "@eslint/*"
          - "typescript-eslint"
          - "globals"
      typescript:
        patterns: ["typescript"]
      vite:
        patterns:
          - "vite"
          - "@vitejs/*"
      vitest:
        patterns:
          - "vitest"
          - "@vitest/*"
          - "@testing-library/*"
          - "jsdom"
      styles:
        patterns:
          - "tailwindcss"
          - "@tailwindcss/*"
          - "daisyui"
          - "autoprefixer"
          - "postcss"
    labels:
      - dependencies
      - frontend

  - package-ecosystem: pip
    directory: /backend
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
    labels:
      - dependencies
      - backend

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
    labels:
      - dependencies
      - ci
```

**Tunable bits:**
- `open-pull-requests-limit`: 5 is the default; bump to 8 if you have many focused groups so they don't get truncated
- `groups` patterns: tailor to your actual deps. The principle is "deps that should move together, group; deps that have independent compatibility, split"

**Defer for now (added in phase 4):** the `cooldown:` block. Don't add it yet — you want the first wave to come through fast so you can validate the setup.

### 1.4 Add audit jobs (initially non-blocking)

In `ci.yml`, add two new jobs. Mark them `continue-on-error: true` for the first iteration so transient findings don't block all CI while you tune.

**Frontend audit:**
```yaml
frontend-audit:
  name: Frontend Dependency Audit
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: frontend
  steps:
    - uses: actions/checkout@<SHA>  # vN
    - uses: actions/setup-node@<SHA>  # vN
      with:
        node-version: '22'
    - name: Audit npm deps
      continue-on-error: true
      run: npm audit --audit-level=high
```

**Backend audit (Python with uv):**
```yaml
backend-audit:
  name: Backend Dependency Audit
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: backend
  steps:
    - uses: actions/checkout@<SHA>  # vN
    - uses: astral-sh/setup-uv@<SHA>  # vN
      with:
        version: "latest"
    - name: Export locked requirements
      run: uv export --format requirements-txt --no-hashes --no-emit-project -o /tmp/requirements.txt
    - name: Audit locked Python deps
      continue-on-error: true
      run: uvx pip-audit -r /tmp/requirements.txt
```

`pip-audit -r requirements.txt` is preferred over `pip-audit` against the env because it scans the *locked* versions, which is what CI actually installs. Same logic for `npm audit` — it reads the lockfile.

### 1.5 Track lockfiles

For Python projects using uv, the `uv.lock` is often gitignored by default. Find and remove it from `.gitignore`:

```diff
-uv.lock
```

Then commit the current lockfile:
```bash
git add backend/uv.lock
```

For npm/pnpm projects, `package-lock.json`/`pnpm-lock.yaml` is usually already tracked. If not, do the same dance.

**Why:** untracked lockfiles mean CI re-resolves transitive deps on every run. The audit job we just added becomes meaningless because it scans a fresh resolution, not a frozen one.

### 1.6 Pin exact frontend versions

In `package.json`, replace every caret/tilde range with the exact resolved version from the lockfile:

```diff
-"@tanstack/react-query": "^5.60.0",
+"@tanstack/react-query": "5.100.5",
```

**Quick extraction:**
```bash
jq -r '
  .packages | to_entries[] |
  select(.key | startswith("node_modules/") and (contains("/node_modules/") | not)) |
  "\(.key | sub("node_modules/"; ""))@\(.value.version)"
' frontend/package-lock.json
```

Map those resolved versions back into `package.json`.

**Why:** lockfile pinning is great until someone runs `npm install <pkg>` and the lockfile gets rewritten, or someone deletes the lockfile entirely. Exact-version constraints in `package.json` are an additional safety net.

### 1.7 Bump any CVE-affected packages the audit catches

The new audit step almost always surfaces some real findings. Patch them in the same PR if they're low-effort (transitive bump via `uv lock --upgrade-package <name>` or moving a direct dep up a patch). Note them in the commit message.

### 1.8 Commit, push, PR

Single commit, single PR. Sample title: `chore: harden CI and deps against supply-chain compromise`. Sample structure for the body — see the rae-budget #29 PR for a worked example.

**Verification before merging:**
- Lint + tests still pass locally
- `npm audit`/`pip-audit` shows zero high+ severity (or known patched items)
- YAML validates (`uvx --from pyyaml python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`)
- All third-party action `uses:` refs end in 40-char hex SHAs

---

## Phase 2: Process the first Dependabot wave

**Goal:** Land as many of the auto-opened PRs as possible without breaking anything, and identify which ones need manual fixing.

**Timing:** Dependabot fires within ~5 minutes of the hardening PR's merge. Expect 5-15 PRs.

### 2.1 Triage by CI status

```bash
gh pr list --state open --label dependencies --limit 30
for n in $(gh pr list --state open --label dependencies --json number --jq '.[].number'); do
  gh pr view $n --json title,statusCheckRollup --jq '{
    n: .number,
    title,
    checks: (.statusCheckRollup | map({name, conclusion}) | unique_by(.name + (.conclusion // "")))
  }'
done
```

Sort into:
- **All green** → mergeable
- **Some failing** → needs investigation

### 2.2 Batch-merge the green ones

Try auto-merge first:
```bash
for n in <PR numbers>; do gh pr merge $n --merge --auto; done
```

If your repo has auto-merge disabled, fall back to plain `--merge`:
```bash
for n in <PR numbers>; do gh pr merge $n --merge --delete-branch; done
```

### 2.3 Three failure modes you'll likely hit

#### "GraphQL: refusing to allow an OAuth App to create or update workflow `.github/workflows/...` without `workflow` scope"

The `gh` CLI token is missing the `workflow` scope. Two paths:

- **Have the user run `gh auth refresh -s workflow`** (interactive; opens browser) and retry
- **Have the user merge those specific PRs from the web UI** — works under their authenticated session, bypasses the CLI scope

Note: this error sometimes hits PRs sporadically. We saw `#31`, `#32` merge fine but `#33`, `#34`, `#36` (all touching `ci.yml`) hit it. Don't burn cycles diagnosing the intermittency — just route those specific PRs through the web UI.

#### "Pull Request has merge conflicts"

After the first PR merges, others touching the same files (typically `package-lock.json`) need rebasing. Dependabot rebases automatically when main moves, but sometimes lags. Trigger explicitly:

```bash
for n in <conflicting PRs>; do gh pr comment $n --body "@dependabot rebase"; done
```

Then poll for `mergeable: MERGEABLE`:

```bash
until [ "$(for n in <PRs>; do gh pr view $n --json mergeable --jq .mergeable; done | sort -u | tr '\n' ',')" = "MERGEABLE," ]; do
  sleep 30
done
```

#### "base branch policy prohibits the merge"

PR was opened before the latest main and needs rebase. Same fix as above — `@dependabot rebase`.

### 2.4 Identify the genuinely-broken bundles

After clearing the green wave, what's left is the legitimately-failing PRs. Common patterns:

- **A "tooling" mega-group failure** — multiple major bumps bundled (Vitest 4, ESLint 10, TypeScript 6, Vite 8) where one or two have breaking changes that block the whole batch. See Phase 3 + Phase 4.1 for the fix.
- **A specific dep with API changes** — e.g., Vitest 4 narrowed the `Mock` type. See Phase 3.1 below.

---

## Phase 3: Fix broken update PRs

**Goal:** Push fixes onto the Dependabot branches so the existing PRs can land instead of being closed and re-opened.

### 3.1 Common fix patterns

These come up enough that they're worth knowing by heart.

#### Vitest 4 narrowed Mock type

**Symptom:** `error TS2322: Type 'Mock<Procedure | Constructable>' is not assignable to type '<your function signature>'` in test files.

**Fix:** parametrize the mock with the target signature.

```diff
-import { describe, it, vi, beforeEach } from 'vitest';
+import { describe, it, vi, beforeEach, type Mock } from 'vitest';

-let onChange: ReturnType<typeof vi.fn>;
+let onChange: Mock<(arg: SomeType) => void>;

 beforeEach(() => {
-  onChange = vi.fn();
+  onChange = vi.fn<(arg: SomeType) => void>();
 });
```

#### react-hooks 7: `set-state-in-effect`

**Symptom:** `error: Calling setState synchronously within an effect can trigger cascading renders`.

**Fix (option A — derive state during render):** if the effect is purely "compute a default from props/state when something changes," replace with derived state.

```diff
-const [selected, setSelected] = useState<number | undefined>();
-useEffect(() => {
-  if (items.length > 0 && !selected) setSelected(items[0].id);
-}, [items, selected]);
+const [explicitlySelected, setSelected] = useState<number | undefined>();
+const selected = explicitlySelected ?? items[0]?.id;
```

**Fix (option B — prev-tracker pattern):** if you need to track a state transition (modal open/close, list identity change), use React 19's documented "reset state on prop change" pattern:

```diff
-useEffect(() => {
-  setHighlightIndex(items.length > 0 ? 0 : -1);
-}, [items]);
+const [prevItems, setPrevItems] = useState(items);
+if (prevItems !== items) {
+  setPrevItems(items);
+  setHighlightIndex(items.length > 0 ? 0 : -1);
+}
```

**Watch out for empty-fallback infinite loops.** If the source of `items` is something like `useQuery` that returns `undefined` when loading, this destructuring pattern:

```ts
const { data: items = [] } = useQuery(...);
```

creates a new `[]` every render → `prevItems !== items` is always true → infinite renders. Stabilize the empty fallback:

```ts
const EMPTY: Item[] = [];  // module-level constant
// ...
const { data } = useQuery(...);
const items = data ?? EMPTY;
```

#### react-hooks 7: `immutability` (Cannot reassign variable after render completes)

**Symptom:** `let foo = 0` mutated inside `.map()` during render.

**Fix:** convert to `.reduce()` so the accumulator is the explicit parameter, no `let` mutation.

```diff
-let runningTotal = 0;
-const withTotals = sorted.map((entry) => {
-  runningTotal += parseFloat(entry.amount);
-  return { ...entry, runningTotal };
-});
+const withTotals = sorted.reduce<Array<typeof sorted[number] & { runningTotal: number }>>(
+  (acc, entry) => {
+    const prev = acc.length > 0 ? acc[acc.length - 1].runningTotal : 0;
+    acc.push({ ...entry, runningTotal: prev + parseFloat(entry.amount) });
+    return acc;
+  },
+  [],
+);
```

### 3.2 Workflow: push fixes onto the Dependabot branch

For each broken PR:

```bash
gh pr checkout <N>
# ... make fixes, run tests locally ...
git add <changed files>
git commit -m "fix: <what you fixed>"
git push
```

If Dependabot has force-rebased the branch since your checkout (common when main moves while you're working), `git push` will fail with "non-fast-forward." **Do not pull-merge** — that adds a noisy merge commit on the Dependabot branch. Instead:

```bash
git fetch origin
git reset --hard origin/<dependabot-branch-name>
git cherry-pick <your-fix-commit-SHA>
git push
```

The end state is the same as a rebase — your fix sits on top of Dependabot's latest bump commit — but no force-push or rewrite of public history is needed.

---

## Phase 4: Cadence and group tuning

**Goal:** Reduce future toil. Now that you've seen one wave, the configuration choices have evidence behind them.

### 4.1 Split mega-groups if any blew up

If a `tooling` umbrella (or similar) bundled too many independent toolchains and one breaking change held the whole bundle hostage, edit `dependabot.yml` to split it. See the rae-budget config (and the example in Phase 1.3) for a sensible decomposition.

Close the broken bundle PR with a comment pointing at the new config:
```bash
gh pr close <N> --comment "Closing in favor of <new-PR-#> which splits the tooling group..."
```

Wait for the next Dependabot cycle (or comment `@dependabot recreate` on the open PRs after the new config lands).

### 4.2 Add a 7-day cooldown

To `.github/dependabot.yml`, add to each ecosystem block:

```yaml
cooldown:
  default-days: 7
```

**Why:** most npm/PyPI supply-chain compromises are detected, deprecated, and pulled within hours-to-days of disclosure. A 7-day cooldown means the broader ecosystem catches and tears down compromised versions before they ever land in your PR queue. Security advisories bypass cooldown automatically, so legit CVE fixes still flow through fast.

### 4.3 Migrate frontend to pnpm with `minimum-release-age` (optional but recommended)

If your frontend uses npm, pnpm gives you two wins:
1. An install-time cooldown that catches manual `pnpm install <pkg>` flows (Dependabot's cooldown is PR-time only)
2. Correct `optionalDependencies` handling — fixes the chronic rollup-native-binary mismatch issue on Apple Silicon / Rosetta-mixed environments

**Steps:**

1. Install pnpm via corepack:
   ```bash
   corepack prepare pnpm@<latest> --activate
   ```

2. Add `packageManager` field to `package.json`:
   ```json
   "packageManager": "pnpm@11.1.2"
   ```

3. Convert the lockfile (preserves exact resolved versions):
   ```bash
   cd frontend && pnpm import && rm package-lock.json
   ```

4. Create `frontend/.npmrc`:
   ```
   minimum-release-age=10080
   shamefully-hoist=false
   strict-peer-dependencies=false
   ```
   `10080` minutes = 7 days. pnpm will refuse to resolve to any version younger than this.

5. Drop the `npm rebuild rollup` postinstall hack from `package.json` if you had one — pnpm handles `optionalDependencies` correctly.

6. Update CI: add `pnpm/action-setup@<SHA>` *before* `actions/setup-node`, and **pass `package_json_file: frontend/package.json`** to the setup action — without that input, it'll fail with `Error: No pnpm version is specified` because the default location is repo root, not the subdirectory:

   ```yaml
   - name: Setup pnpm
     uses: pnpm/action-setup@<SHA>  # v4
     with:
       package_json_file: frontend/package.json

   - name: Setup Node.js
     uses: actions/setup-node@<SHA>  # vN
     with:
       node-version: '22'
       cache: 'pnpm'
       cache-dependency-path: frontend/pnpm-lock.yaml
   ```

7. Replace `npm ci` → `pnpm install --frozen-lockfile`, `npm run X` → `pnpm X`, `npm audit --audit-level=high` → `pnpm audit --audit-level high` (note the space, not `=`), `npx tsc` → `pnpm exec tsc`.

8. Update README + agent instructions (CLAUDE.md or equivalent) to reflect the new commands. Remove any "rollup native binary" gotcha section — it no longer applies.

### 4.4 Flip audits to blocking

Once you've confirmed the audits aren't generating false positives, remove `continue-on-error: true` from both the frontend and backend audit jobs. A new high-severity advisory in the locked tree now fails the build, forcing a triage decision.

If noise becomes a problem, the un-block is a one-line revert.

### 4.5 Add badges to README

```markdown
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-025E8C?logo=dependabot&logoColor=white)](./.github/dependabot.yml)
```

Linking to the config file (not GitHub's network/updates page) is friendlier — reviewers can see the actual rules without leaving the repo.

---

## Cross-cutting gotchas

These bit us during the rae-budget session. Worth knowing in advance.

### Flask hot-reload doesn't pick up new blueprint routes

If you add a new route inside an existing blueprint while the API container has been running for a while, Flask's auto-reloader may not register it. Symptom: route returns 404 from Werkzeug even though it exists in the file. Fix: `docker compose restart api`.

### Dependabot needs main to have the config first

Dependabot won't fire on a config that exists only on a feature branch. The hardening PR must merge before you see the first wave.

### `gh` CLI workflow scope is intermittent

The `workflow` OAuth scope is required to merge PRs that modify `.github/workflows/*`. The error is consistent in its existence but intermittent in its triggering. Don't waste time on the diagnosis — route affected merges through the web UI.

### Don't bundle docs updates with the bump fixes

If you're pushing a fix commit onto a Dependabot branch, keep the diff minimal to the actual fix. Out-of-scope changes (version bumps unrelated to the PR, doc edits) make the PR's diff harder for the next agent to review and harder to revert if needed.

### Verify pnpm version source

If you add `packageManager: "pnpm@X.Y.Z"` to `package.json` but the file is in a subdirectory, the `pnpm/action-setup` action won't find it unless you pass `package_json_file: <path>`. The error message — "No pnpm version is specified" — does not point at the cause.

---

## Decision points worth flagging back to the human

This playbook covers the no-brainer parts. A few choices benefit from human input:

- **Cooldown duration.** 7 days is a reasonable default; some orgs use 3 (less safe, fewer surprises) or 14 (safer, more out-of-date). Ask.
- **Auto-merge enabled at repo level.** Lets `gh pr merge --auto` queue PRs cleanly. Not the agent's call.
- **Branch protection on main.** Required to make audit-blocking meaningful in practice (otherwise a human with write access can override). Not the agent's call.
- **Whether to migrate package managers.** pnpm has clear wins but is a real change to contributor workflow. Ask before doing.
- **What to do with the residual gaps.** SBOM generation, signed commits, runtime sandboxing — beyond the scope of "harden the supply chain" and into separate hardening programs.

---

## What this playbook explicitly does *not* cover

- Code-level vulnerabilities (XSS, SQLi, auth bugs). Use a SAST tool and `/security-review` skill.
- Runtime sandboxing. Container hardening, seccomp, AppArmor are separate concerns.
- Secrets in git history. Use `gitleaks` or similar; out of scope here.
- SBOM generation and attestation publishing. Worth doing later but doesn't address the same attack vectors as this playbook.
- Frontend SRI (subresource integrity) for runtime-loaded assets. Mostly moot for Vite bundled builds; relevant for CDN-loaded scripts.

---

## Final state checklist

After running this playbook to completion, you should be able to answer "yes" to each:

- [ ] Every workflow has top-level `permissions: contents: read`
- [ ] Every third-party Action is pinned to a 40-char commit SHA
- [ ] `.github/dependabot.yml` exists, covers npm/pip/github-actions, has focused groups (not a single `tooling` umbrella), and has a 7-day `cooldown:` block
- [ ] Both lockfiles (`pnpm-lock.yaml` or `package-lock.json`, and `uv.lock`/`poetry.lock`/`Pipfile.lock`) are tracked in git
- [ ] Frontend `package.json` deps are pinned to exact versions (no `^` or `~`)
- [ ] `npm audit` / `pnpm audit` and `pip-audit` run on every CI run and are **not** marked `continue-on-error`
- [ ] If using pnpm: `minimum-release-age=10080` is in `.npmrc`
- [ ] README has a Dependabot badge linking to the config
- [ ] Agent-facing docs (CLAUDE.md, AGENTS.md, etc.) reflect the new package-manager commands

If any are unchecked, the corresponding phase above explains how to get there.
