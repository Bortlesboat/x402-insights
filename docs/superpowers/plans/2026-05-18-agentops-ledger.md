# AgentOps Ledger Implementation Plan

Historical note: this 2026-05-18 implementation plan uses the earlier working name. The current public project name is Agent Payment Ledger, and it is not affiliated with AgentOps.ai.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `x402-insights` into AgentOps Ledger, a local-first enterprise-agent flight recorder with run timelines, approval/payment/tool-call events, audit export, and hackathon-ready packaging.

**Architecture:** Extend the existing TypeScript SDK, Express/SQLite backend, and static dashboard instead of replacing the stack. Preserve existing x402 spend events while adding run-aware event types and a polished demo workflow for NandaHack/Splunk/Google submissions.

**Tech Stack:** TypeScript SDK, Node.js, Express, better-sqlite3, static HTML/CSS/JS, SQLite, built-in Node smoke scripts.

---

## File Structure

- Modify: `sdk/src/index.ts`
  - Add generic AgentOps Ledger SDK helpers.
  - Preserve `configure()` and `trackX402()`.
- Modify: `sdk/package.json`
  - Add `test` script after SDK smoke test exists.
- Create: `sdk/test-sdk.mjs`
  - Build-output smoke test for SDK functions against a local in-memory HTTP receiver.
- Modify: `server/server.js`
  - Add run-aware schema fields, `runs` table, summary APIs, run export API, and compatibility handling.
- Modify: `server/seed.js`
  - Replace random-only seed with deterministic AgentOps Ledger demo runs while keeping enough spend data for current charts.
- Create: `server/smoke-test.js`
  - Starts the server on a temporary port/database, posts demo events, checks run APIs and export.
- Modify: `server/package.json`
  - Add `test` and `seed` scripts.
- Modify: `server/public/index.html`
  - Rebrand as AgentOps Ledger.
  - Add run list, run timeline, risk flags, and export link while preserving existing spend charts.
- Modify: `README.md`
  - Update positioning, quick start, architecture, and hackathon demo flow.
- Create: `docs/hackathon/agentops-ledger-submission.md`
  - Submission copy, demo script, target hackathon framing.
- Preserve: existing dirty local edits in `sdk/package.json`, `sdk/tsconfig.json`, `server/server.js`, and `server/public/index.html`.
- Ignore: untracked `logs/`, `server/logs/`, SQLite WAL/SHM, and generated screenshots until explicitly needed.

## Chunk 1: Backend Ledger APIs

### Task 1: Add run-aware schema and ingestion

**Files:**
- Modify: `server/server.js`
- Test: `server/smoke-test.js` in Task 3

- [ ] **Step 1: Extend the `events` table migration**

Add these columns through the existing `addCol` helper:

```js
addCol("run_id", "run_id TEXT");
addCol("event_type", "event_type TEXT DEFAULT 'payment'");
addCol("step_name", "step_name TEXT");
addCol("tool_name", "tool_name TEXT");
addCol("approval_status", "approval_status TEXT");
addCol("metadata_json", "metadata_json TEXT");
```

Add indexes:

```js
CREATE INDEX IF NOT EXISTS idx_events_run_id ON events(run_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
```

- [ ] **Step 2: Add the `runs` table**

Create a table near the existing `events` table creation:

```js
CREATE TABLE IF NOT EXISTS runs (
  run_id       TEXT PRIMARY KEY,
  agent        TEXT NOT NULL,
  workflow     TEXT NOT NULL,
  environment  TEXT NOT NULL DEFAULT 'dev',
  source       TEXT NOT NULL DEFAULT 'unknown',
  started_at   TEXT NOT NULL,
  finished_at  TEXT,
  status       TEXT NOT NULL DEFAULT 'running',
  summary      TEXT
);
```

- [ ] **Step 3: Update `insertEvent`**

Add the new columns to the insert statement:

```js
run_id, event_type, step_name, tool_name, approval_status, metadata_json
```

When storing metadata, stringify objects:

```js
const metadataJson = e.metadata
  ? JSON.stringify(e.metadata)
  : e.metadata_json || null;
```

- [ ] **Step 4: Generate fallback run ids for legacy events**

Inside `POST /events`, set:

```js
const eventType = e.event_type || e.phase || "payment";
const runId = e.run_id || `legacy-${e.request_id || e.timestamp || Date.now()}`;
```

Do not create a `runs` row for legacy x402 events unless `event_type` is `run_start`.

- [ ] **Step 5: Upsert runs for start/finish events**

If `event_type === "run_start"`, insert or replace a `runs` row.

If `event_type === "run_finish"`, update `finished_at`, `status`, and `summary`.

Use `INSERT INTO runs ... ON CONFLICT(run_id) DO UPDATE SET ...` for start events.

- [ ] **Step 6: Run syntax check**

Run:

```powershell
node --check server/server.js
```

Expected: no output and exit code 0.

### Task 2: Add run summary and export endpoints

**Files:**
- Modify: `server/server.js`
- Test: `server/smoke-test.js`

- [ ] **Step 1: Add summary helper**

Add a helper:

```js
function summarizeRun(runId) {
  const events = db.prepare(`SELECT * FROM events WHERE run_id = ? ORDER BY timestamp ASC, id ASC`).all(runId);
  const totals = db.prepare(`
    SELECT
      COUNT(*) as event_count,
      COALESCE(SUM(cost),0) as total_cost,
      COALESCE(SUM(CASE WHEN status='error' THEN 1 ELSE 0 END),0) as error_count,
      COALESCE(SUM(CASE WHEN is_retry=1 THEN 1 ELSE 0 END),0) as retry_count,
      COALESCE(SUM(CASE WHEN event_type='approval' THEN 1 ELSE 0 END),0) as approval_count,
      COALESCE(MAX(latency_ms),0) as max_latency_ms
    FROM events WHERE run_id = ?
  `).get(runId);
  return { events, totals };
}
```

- [ ] **Step 2: Add `GET /api/runs`**

Return recent runs joined to event aggregates. Include:

```json
{
  "run_id": "run_demo_vendor_success",
  "agent": "vendor-risk-agent",
  "workflow": "vendor-risk-review",
  "status": "success",
  "total_cost": 0.012,
  "event_count": 8,
  "error_count": 0,
  "approval_count": 1
}
```

- [ ] **Step 3: Add `GET /api/runs/:run_id`**

Return:

```json
{
  "run": {},
  "summary": {},
  "events": []
}
```

Parse `metadata_json` into `metadata` if valid JSON.

- [ ] **Step 4: Add `GET /api/runs/:run_id/export`**

Return the same shape as the run detail endpoint with:

```js
res.setHeader("Content-Disposition", `attachment; filename="${runId}-audit.json"`);
```

- [ ] **Step 5: Add risk flags**

For run detail, include:

```js
risk_flags: [
  "retry_spend",
  "errors_present",
  "approval_missing",
  "unfinished_run"
]
```

Only include flags that apply.

- [ ] **Step 6: Run syntax check**

Run:

```powershell
node --check server/server.js
```

Expected: no output and exit code 0.

### Task 3: Add server smoke test

**Files:**
- Create: `server/smoke-test.js`
- Modify: `server/package.json`

- [ ] **Step 1: Write failing smoke test**

Create `server/smoke-test.js` that:

1. Starts `server.js` as a child process with:
   - `PORT=4199`
   - `INSIGHTS_DB=<repo>/server/test-agentops-ledger.db`
   - `INSIGHTS_API_KEY=test-key`
2. Posts one `run_start`, one `tool_call`, one `approval`, one `payment`, and one `run_finish` to `/events`.
3. Fetches `/api/runs`.
4. Fetches `/api/runs/<run_id>`.
5. Fetches `/api/runs/<run_id>/export`.
6. Fails if run status, event count, total cost, or approval count are wrong.
7. Stops the child process.

Use only built-in Node modules:

```js
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
```

- [ ] **Step 2: Add scripts**

In `server/package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "node --watch server.js",
  "seed": "node seed.js",
  "test": "node smoke-test.js"
}
```

- [ ] **Step 3: Run test and verify it fails before API implementation**

Run:

```powershell
npm.cmd test
```

from `server/`.

Expected before implementation: failure on missing `/api/runs` or missing summary fields.

- [ ] **Step 4: Run test after implementation**

Run:

```powershell
npm.cmd test
```

Expected after implementation: `server smoke test passed`.

## Chunk 2: SDK Instrumentation

### Task 4: Add AgentOps Ledger SDK helpers

**Files:**
- Modify: `sdk/src/index.ts`
- Test: `sdk/test-sdk.mjs`

- [ ] **Step 1: Add event interfaces**

Add:

```ts
export type AgentOpsEventType =
  | "run_start"
  | "step"
  | "tool_call"
  | "approval"
  | "payment"
  | "policy"
  | "error"
  | "run_finish";
```

Add `run_id`, `event_type`, `step_name`, `tool_name`, `approval_status`, and `metadata` to `TrackEvent`.

- [ ] **Step 2: Add run id helper**

Add:

```ts
function makeRunId(prefix = "run"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
```

- [ ] **Step 3: Export `emitEvent()`**

Refactor `sendEvent` into an exported or internal `emitEvent` that all helpers use. Keep it non-blocking-safe and preserve warning behavior.

- [ ] **Step 4: Add `startRun()`**

Signature:

```ts
export async function startRun(input: {
  run_id?: string;
  agent: string;
  workflow: string;
  environment?: string;
  source?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}): Promise<string>
```

It emits a `run_start` event and returns the run id.

- [ ] **Step 5: Add `trackStep()`**

Emit a `step` event with `step_name`, `status`, and optional metadata.

- [ ] **Step 6: Add `trackToolCall()`**

Signature:

```ts
export async function trackToolCall<T>(input: {
  run_id: string;
  agent: string;
  workflow: string;
  step_name: string;
  tool_name: string;
  endpoint?: string;
  fn: () => Promise<T>;
  metadata?: Record<string, unknown>;
}): Promise<T>
```

It records success or error, latency, and rethrows the original error.

- [ ] **Step 7: Add `trackApproval()`**

Emit approval events with `approval_status` values:

```ts
"requested" | "approved" | "rejected" | "bypassed"
```

- [ ] **Step 8: Add `trackPayment()`**

Emit payment events with `cost`, `currency`, `provider`, `endpoint`, `phase`, and metadata.

- [ ] **Step 9: Add `finishRun()`**

Emit a `run_finish` event with final `status` and summary.

- [ ] **Step 10: Preserve `trackX402()`**

Keep the public signature. Set:

```ts
event_type: "payment"
run_id: opts.run_id
```

Add `run_id?: string` to `TrackOptions<T>`.

- [ ] **Step 11: Build SDK**

Run:

```powershell
npm.cmd run build
```

from `sdk/`.

Expected: TypeScript build succeeds.

### Task 5: Add SDK smoke test

**Files:**
- Create: `sdk/test-sdk.mjs`
- Modify: `sdk/package.json`

- [ ] **Step 1: Create test receiver**

Create a small Node HTTP server that captures posted events and returns `{ ok: true }`.

- [ ] **Step 2: Import built SDK**

After `npm.cmd run build`, import:

```js
const sdk = await import("./dist/index.js");
```

- [ ] **Step 3: Exercise helpers**

Call:

```js
sdk.configure({ baseUrl, apiKey: "test-key", defaultEnvironment: "test" });
const runId = await sdk.startRun({ agent: "test-agent", workflow: "test-flow" });
await sdk.trackStep({ run_id: runId, agent: "test-agent", workflow: "test-flow", step_name: "plan" });
await sdk.trackToolCall({ run_id: runId, agent: "test-agent", workflow: "test-flow", step_name: "search", tool_name: "mock.search", fn: async () => ({ ok: true }) });
await sdk.trackApproval({ run_id: runId, agent: "test-agent", workflow: "test-flow", step_name: "approve", approval_status: "approved" });
await sdk.trackPayment({ run_id: runId, agent: "test-agent", workflow: "test-flow", endpoint: "x402://demo", cost: 0.01, currency: "USDC" });
await sdk.finishRun({ run_id: runId, agent: "test-agent", workflow: "test-flow", status: "success" });
```

- [ ] **Step 4: Assert captured events**

Assert there are six events and that event types include `run_start`, `tool_call`, `approval`, `payment`, and `run_finish`.

- [ ] **Step 5: Add script**

In `sdk/package.json`:

```json
"scripts": {
  "build": "tsc",
  "test": "npm run build && node test-sdk.mjs"
}
```

- [ ] **Step 6: Run SDK test**

Run:

```powershell
npm.cmd test
```

from `sdk/`.

Expected: `sdk smoke test passed`.

## Chunk 3: Demo Data and Dashboard

### Task 6: Add deterministic demo run seed

**Files:**
- Modify: `server/seed.js`

- [ ] **Step 1: Replace purely random seed with named demo runs**

Seed at least:

- `run_demo_vendor_success`: successful vendor risk review with approval and payment.
- `run_demo_vendor_retry`: tool retry plus final success.
- `run_demo_vendor_blocked`: approval rejected or unfinished run.

- [ ] **Step 2: Keep source as demo**

Set:

```js
source: "demo",
environment: "dev"
```

so filters work.

- [ ] **Step 3: Include varied events**

Each run should include:

- `run_start`
- `step`
- `tool_call`
- `approval`
- `payment` for at least one run
- `run_finish` for successful/failed runs

- [ ] **Step 4: Run seed against local server**

Run:

```powershell
npm.cmd run seed
```

from `server/` while the server is running.

Expected: console prints seeded run count.

### Task 7: Rework dashboard around run timelines

**Files:**
- Modify: `server/public/index.html`

- [ ] **Step 1: Rebrand header**

Change:

```html
<title>x402-insights</title>
<h1>x402-insights</h1>
<div class="sub">what your agent is actually spending</div>
```

to AgentOps Ledger wording:

```html
<title>AgentOps Ledger</title>
<h1>AgentOps Ledger</h1>
<div class="sub">flight recorder for enterprise agents</div>
```

- [ ] **Step 2: Add run list card above charts**

Add a `Recent agent runs` table with:

- status
- agent
- workflow
- cost
- errors
- approvals
- duration

Rows should be clickable and set `selectedRunId`.

- [ ] **Step 3: Add run detail/timeline card**

Show selected run details:

- summary metrics
- risk flags
- ordered event timeline
- export link to `/api/runs/:run_id/export`

- [ ] **Step 4: Preserve existing spend charts**

Keep spend by endpoint and spend by agent charts below the run timeline. They remain useful for x402/payment-specific demos.

- [ ] **Step 5: Add empty states**

If no runs exist, show:

```text
No agent runs yet. Run `npm run seed` or instrument your agent with startRun().
```

- [ ] **Step 6: Verify in browser**

Start server and seed demo data, then open the dashboard.

Expected:

- run list is visible
- clicking a run shows timeline
- export link returns JSON
- charts still render

## Chunk 4: Docs and Hackathon Package

### Task 8: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite opening**

Lead with:

```md
# AgentOps Ledger

Flight recorder for enterprise agents. Record every tool call, approval gate, retry, error, payment, and final outcome in one local audit trail.
```

- [ ] **Step 2: Add quick start**

Include:

```powershell
cd server
npm install
npm run start

# second terminal
npm run seed
```

- [ ] **Step 3: Add SDK example**

Show `startRun`, `trackToolCall`, `trackApproval`, `trackPayment`, and `finishRun`.

- [ ] **Step 4: Preserve x402 section**

Move current x402-specific content under:

```md
## x402 payment observability
```

- [ ] **Step 5: Add hackathon positioning**

Mention NandaHack, Splunk Agentic Ops, and Google Rapid Agent without overclaiming awards or finalist status.

### Task 9: Add submission package draft

**Files:**
- Create: `docs/hackathon/agentops-ledger-submission.md`

- [ ] **Step 1: Add project summary**

Include:

- title
- one-liner
- problem
- solution
- target users
- why now

- [ ] **Step 2: Add demo script**

Five-part script:

1. Enterprise agent risk problem.
2. Instrumentation in code.
3. Run the vendor-risk demo.
4. Inspect timeline/risk flags/export.
5. Explain hackathon fit and future path.

- [ ] **Step 3: Add submission variants**

Include short sections:

- NandaHack framing.
- Splunk Agentic Ops framing.
- Google Rapid Agent framing.
- UiPath AgentHack optional framing.

- [ ] **Step 4: Add screenshot checklist**

List:

- dashboard run list
- selected run timeline
- audit JSON export
- SDK snippet

## Chunk 5: Verification and Packaging

### Task 10: Run local verification

**Files:**
- No code edits unless tests fail.

- [ ] **Step 1: SDK test**

Run:

```powershell
cd <repo-root>/sdk
npm.cmd test
```

Expected: SDK build succeeds and smoke test passes.

- [ ] **Step 2: Server test**

Run:

```powershell
cd <repo-root>/server
npm.cmd test
```

Expected: server smoke test passes.

- [ ] **Step 3: Manual API smoke**

Run server and seed:

```powershell
cd <repo-root>/server
npm.cmd run start
```

In another shell:

```powershell
npm.cmd run seed
Invoke-WebRequest -Uri http://localhost:4000/api/runs
```

Expected: JSON includes demo runs.

- [ ] **Step 4: Browser verification**

Open `http://localhost:4000`.

Expected:

- visible AgentOps Ledger header
- visible run list
- selected run timeline
- charts not blank
- export link works

### Task 11: Final audit

**Files:**
- Modify: `tasks/todo.md`
- Maybe modify: external workspace memory for `project_x402_insights.md`
- Maybe modify: external Obsidian project status notes

- [ ] **Step 1: Inspect git diff**

Run:

```powershell
git status --short
git diff --stat
```

Expected: only intended files plus pre-existing dirty files.

- [ ] **Step 2: Update task review**

Add a review section to the local task tracker with:

- what shipped
- verification commands and results
- remaining launch tasks

- [ ] **Step 3: Sync memory/docs if facts changed**

If the repo now has AgentOps Ledger working, update:

- external workspace memory for `project_x402_insights.md`
- relevant Obsidian project note if found by search

- [ ] **Step 4: Completion audit**

Restate objective:

Build one polished enterprise-agent infrastructure tool for current 2026 agent hackathons and use it to win visibility, prizes, and portfolio credibility.

Checklist evidence required:

- working tool exists
- tool is polished enough to demo
- hackathon target and submission package exist
- tests/build pass
- dashboard verified visually
- launch/visibility assets exist
- no unrelated dirty changes were reverted

Only mark the active goal complete if every item is evidenced.
