# AgentOps Ledger Design

Historical note: this 2026-05-18 planning document uses the earlier working name. The current public project name is Agent Payment Ledger, and it is not affiliated with AgentOps.ai.

**Date:** 2026-05-18
**Primary target:** NandaHack Agentic AI Hackathon
**Secondary targets:** Splunk Agentic Ops Hackathon, Google Cloud Rapid Agent Hackathon, UiPath AgentHack
**Repository:** `<repo-root>`
**Status:** Design approved for planning

## Goal

Build one polished enterprise-agent infrastructure tool that records, explains, and exports what autonomous agents do in real operational workflows. The product should be strong enough for 2026 agent hackathon submissions and credible enough for Andy's portfolio.

## Product Name

AgentOps Ledger.

The existing `x402-insights` project remains the codebase seed. The public package and repo can either keep the `x402-insights` name with an "AgentOps Ledger" hackathon edition, or rename later after the working demo proves the broader scope.

## Hackathon Fit

### NandaHack

NandaHack asks teams to build practical infrastructure for enterprise AI agents, with emphasis on trust, coordination, memory, safety, integration, and production-like evaluation. AgentOps Ledger is a trust and operations layer: it lets a stock agent produce a readable evidence trail of what it did, what it spent, where it failed, and where a human stayed in control.

### Splunk Agentic Ops

Splunk's hackathon focuses on observability, security, and platform workflows grounded in operational data. AgentOps Ledger can export agent-run events as JSONL or Splunk-friendly events, making the agent itself observable like any other production system.

### Google Rapid Agent

Google Rapid Agent requires functional Gemini/Google Cloud agents with partner MCP integrations. AgentOps Ledger can demonstrate a Gemini-style tool workflow with MCP-like tool events, partner-system calls, cost, retries, and final outcomes.

### UiPath AgentHack

UiPath rewards enterprise agent orchestration, human-in-the-loop steps, and coding-agent usage. AgentOps Ledger can be framed as a companion audit layer around a UiPath-orchestrated case, but this is a secondary target because it requires deeper platform-specific setup.

## User Problem

Enterprise teams are willing to try agents, but they cannot comfortably deploy agents that touch real tools without a clear answer to four questions:

1. What exactly did the agent do?
2. What did each action cost?
3. Where did it fail, retry, or drift?
4. Which actions needed or received human approval?

Existing demos often show the final answer but hide the run. AgentOps Ledger exposes the run.

## Core Promise

"Give every enterprise agent a flight recorder."

After adding a small SDK wrapper, a developer gets:

- A run timeline that shows each tool call, payment, approval, retry, error, and final result.
- Spend and latency metrics by run, tool, endpoint, workflow, and agent.
- Human approval markers for actions that should not be fully autonomous.
- Exportable audit JSON for compliance, postmortems, security review, and hackathon judging.

## Existing Asset

The current repo already provides:

- TypeScript SDK with `configure()` and `trackX402()`.
- x402 facilitator adapter that hooks verify and settle lifecycle events.
- Express ingestion server.
- SQLite storage.
- Static dashboard.
- Real Base Sepolia x402 event evidence.
- Leaderboard tracker and launch draft.

AgentOps Ledger should reuse this rather than start over.

## V1 Scope

V1 is a local-first agent-run ledger and dashboard:

- Generic run/session model.
- Generic event ingestion for tool calls, approvals, costs, retries, errors, and outcomes.
- Updated SDK functions for common agent instrumentation.
- Dashboard run list and run timeline.
- Summary metrics: cost, retries, errors, approval count, latency, status.
- Export endpoint for a single run as JSON.
- Demo script that simulates an enterprise workflow with payments and approval gates.
- README and hackathon submission assets.

## Non-Goals

- Hosted SaaS.
- Multi-tenant auth.
- Complex policy engine.
- Enterprise SSO.
- Long-term storage backend beyond SQLite.
- Deep Splunk, UiPath, or Google Cloud platform lock-in for the first build.
- Replacing x402-insights payment observability. Payment events remain a first-class event type inside the broader ledger.

## Architecture

### SDK

The SDK should expose a small, memorable API:

```ts
import {
  configure,
  startRun,
  trackStep,
  trackToolCall,
  trackApproval,
  trackPayment,
  finishRun,
} from "x402-insights";
```

Primary functions:

- `startRun(input)`: creates or records a run start event and returns a `run_id`.
- `trackStep(input)`: records a named reasoning or workflow step.
- `trackToolCall(input)`: wraps a tool call and records inputs metadata, output metadata, latency, status, and error.
- `trackApproval(input)`: records human approval requested, approved, rejected, or bypassed.
- `trackPayment(input)`: records spend, currency, payment network, endpoint, phase, and transaction metadata.
- `finishRun(input)`: records final status and outcome summary.

Existing `trackX402()` stays for backward compatibility and becomes a convenience wrapper around `trackPayment()` plus tool-call-style timing.

### Backend

Keep Express and SQLite.

Tables:

- `runs`: one row per agent run.
- `events`: append-only event stream.

The current `events` table can be migrated in place. Existing x402 events should be assigned a generated `run_id` when missing, or rendered in a legacy "ungrouped events" view until new data exists.

APIs:

- `POST /events`: existing ingestion path, extended with `run_id`, `event_type`, `step_name`, `metadata`.
- `POST /runs`: optional explicit run creation.
- `GET /api/runs`: list recent runs with summary metrics.
- `GET /api/runs/:run_id`: run detail plus ordered events.
- `GET /api/runs/:run_id/export`: full audit JSON.
- `GET /api/overview`: preserve current dashboard metrics and extend with run counts.

### Dashboard

The dashboard should feel like an operations console, not a marketing page.

Primary views:

- Run list: status, agent, workflow, cost, duration, error count, approval count, latest event.
- Run detail: left-side event timeline, right-side summary metrics and risk flags.
- Event table: filter by event type, environment, source, status.
- Export button: downloads or opens audit JSON for the selected run.

Risk flags:

- Error occurred.
- Retry spend above zero.
- Approval requested but missing final approval status.
- Destructive or external action without approval marker.
- Run did not finish.

Use the existing static HTML dashboard unless the UI becomes too hard to maintain. Do not introduce React/Vite in V1 unless a design or demo requirement makes it clearly worth the cost.

## Data Model

### Run

```json
{
  "run_id": "run_01HX...",
  "agent": "claims-intake-agent",
  "workflow": "vendor-risk-review",
  "environment": "demo",
  "source": "agentops-demo",
  "started_at": "2026-05-18T12:00:00.000Z",
  "finished_at": "2026-05-18T12:00:08.000Z",
  "status": "success",
  "summary": "Reviewed vendor risk and waited for approval before settlement."
}
```

### Event

```json
{
  "run_id": "run_01HX...",
  "event_type": "tool_call",
  "timestamp": "2026-05-18T12:00:01.500Z",
  "agent": "claims-intake-agent",
  "workflow": "vendor-risk-review",
  "step_name": "search_vendor_records",
  "tool_name": "mcp.elasticsearch.search",
  "endpoint": "elastic://vendors/_search",
  "provider": "elastic/mcp",
  "cost": 0,
  "currency": "USD",
  "latency_ms": 418,
  "status": "success",
  "metadata": {
    "input_hash": "sha256:...",
    "records_returned": 12
  }
}
```

Event types:

- `run_start`
- `step`
- `tool_call`
- `approval`
- `payment`
- `policy`
- `error`
- `run_finish`

## Demo Scenario

Use a realistic enterprise flow:

"Vendor Risk Review Agent"

The agent:

1. Starts a run.
2. Searches a vendor record source.
3. Calls an enrichment tool.
4. Hits a flaky tool once and retries.
5. Requests human approval before a paid external action.
6. Records an x402-style payment event.
7. Finishes with a risk summary.
8. Exports a full run audit JSON.

This scenario is broad enough for enterprise judges and still lets the x402 spend observability asset shine.

## Testing Strategy

Backend:

- Ingestion validates required fields.
- Run creation works.
- Event insertion assigns or preserves `run_id`.
- Run summary aggregates cost, latency, errors, retries, approvals, and status.
- Export endpoint returns the run and ordered events.

SDK:

- `startRun()` returns a stable run id.
- `trackToolCall()` records success and rethrows failures after logging.
- `trackApproval()` records approval statuses.
- `trackPayment()` records spend and phase.
- Backward-compatible `trackX402()` still emits usable events.

Demo:

- Seed/demo script produces at least one successful run and one run with a retry/error.
- Dashboard APIs show both runs.

Verification:

- `npm test` or focused Node test command for backend/SDK.
- `npm run build` for TypeScript packages.
- Start server locally and call API endpoints.
- Browser screenshot of run list and run detail before submission packaging.

## Launch Package

Required hackathon assets:

- Public GitHub README with setup, demo, screenshots, and architecture.
- Short demo video script.
- Screenshot assets.
- Devpost/NandaHack submission copy.
- `docs/hackathon/agentops-ledger-submission.md` with target-specific framing.
- Optional blog post or X thread for visibility.

## Risks

### Scope Creep

Trying to support every agent framework will weaken the first demo. The SDK should be framework-neutral, but the demo should be one polished workflow.

### Dashboard Polish

The current dashboard is useful but may not be polished enough for prizes. If static HTML becomes slow to improve, a small Vite dashboard can be justified, but only after the data model and APIs work.

### x402 Narrowness

The repo is currently x402-specific. The product must visibly handle non-payment events, or NandaHack judges may see it as crypto-only infrastructure. Payment observability should be one differentiator, not the whole story.

### Existing Dirty Worktree

The repo has uncommitted local edits and untracked logs. New work must preserve existing changes and avoid committing logs or generated artifacts by accident.

## Success Criteria

The build is done when:

- A developer can run the server locally.
- A demo agent run generates a complete ledger.
- The dashboard shows a readable run list and timeline.
- The export endpoint returns audit JSON for a run.
- Existing x402 event capture still works or has a documented compatibility path.
- Tests/builds pass for touched packages.
- Screenshots and submission copy exist.
- The product can be submitted to NandaHack with a credible README and demo video script.
