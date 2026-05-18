# AgentOps Ledger Hackathon Submission Draft

## Title

AgentOps Ledger

## Public Links

- Repository: https://github.com/Bortlesboat/x402-insights
- Pull request: https://github.com/Bortlesboat/x402-insights/pull/1
- Demo release: https://github.com/Bortlesboat/x402-insights/releases/tag/agentops-ledger-2026-05-18
- Demo MP4: https://github.com/Bortlesboat/x402-insights/releases/download/agentops-ledger-2026-05-18/agentops-ledger-demo-46s.mp4
- Architecture: https://github.com/Bortlesboat/x402-insights/blob/main/ARCHITECTURE.md

## One-Liner

Flight recorder for enterprise agents: inspect every tool call, approval gate, retry, error, payment, and final outcome in one local audit trail.

## Problem

Enterprise teams cannot safely hand agents real tools until they can answer what the agent did, what it spent, where it failed, and where a human stayed in control. Most agent demos show the final response but hide the operational trace.

## Solution

AgentOps Ledger records agent runs as append-only events and renders them as an operations dashboard. Developers add a small SDK wrapper around workflows and tool calls. The server stores events in SQLite, groups them by run, computes risk flags, and exports audit JSON for review.

## Target Users

- Agent platform teams
- Enterprise automation teams
- SRE and security reviewers
- Developers adding paid APIs, MCP tools, or human approval gates to agents

## Why Now

2026 agent hackathons are moving from chat demos toward enterprise-grade agent infrastructure. Agents increasingly touch paid APIs, internal systems, and external actions. The missing layer is boring in the best way: an audit trail that makes runs inspectable.

## Demo Script

### 1. Open With The Risk

"Here is the problem with enterprise agents: the dangerous part is not the final answer. It is everything the agent did on the way there."

Show the dashboard with three demo runs.

### 2. Show The Instrumentation

Show the SDK snippet:

```ts
const run_id = await startRun({ agent, workflow });
await trackToolCall({ run_id, agent, workflow, step_name, tool_name, fn });
await trackApproval({ run_id, agent, workflow, step_name, approval_status: "approved" });
await trackPayment({ run_id, agent, workflow, endpoint, cost, currency: "USDC" });
await finishRun({ run_id, agent, workflow, status: "success" });
```

### 3. Run The Vendor-Risk Demo

Seed or run the vendor risk workflow. It should show:

- a successful vendor review
- a run with one failed tool call and retry
- a blocked high-risk payment after human rejection

### 4. Inspect The Timeline

Click the blocked run. Show:

- tool call
- requested approval
- rejected approval
- final error status
- risk flag

Then open the successful run and show the x402-style payment event.

### 5. Export The Audit JSON

Click `export JSON`. Explain that the output can be stored with incident reviews, compliance notes, platform evals, or operations telemetry.

### 6. Close

"AgentOps Ledger makes agents inspectable before they become production systems."

## NandaHack Framing

AgentOps Ledger is practical trust infrastructure for enterprise agents. It supports the core enterprise needs NandaHack emphasizes: safety, integration, coordination, and production-like evaluation. The demo is deliberately simple enough for a stock agent workflow to use without platform lock-in.

## Splunk Agentic Ops Framing

AgentOps Ledger turns agent behavior into operational telemetry. The Splunk HEC adapter exports each run event as `agentops:run_event` telemetry so security, reliability, and cost investigations can happen in Splunk.

## Google Rapid Agent Framing

AgentOps Ledger can wrap Gemini or MCP-style tool workflows and make partner-system calls visible. The value is not a new model; it is the operational evidence layer around agent behavior.

## UiPath AgentHack Framing

AgentOps Ledger complements enterprise automation by showing human approval gates and final outcomes around agentic workflow execution.

## Screenshot Checklist

- Dashboard with recent runs: `docs/agentops-ledger-dashboard.png`
- Mobile dashboard proof: `docs/agentops-ledger-mobile.png`
- Selected blocked run timeline
- Successful run with payment event
- Audit JSON export
- SDK snippet from README

## Submission Checklist

- Working local dashboard
- Deterministic seed demo
- SDK smoke test
- Server smoke test
- Splunk HEC adapter smoke test
- Root architecture diagram
- README quick start
- Demo video or screen recording
- Public repository link
