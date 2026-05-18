# Splunk Agentic Ops Submission Packet

This is the public, judge-facing submission packet for AgentOps Ledger and the Splunk Agentic Ops Hackathon.

Current status: the project is ready for the Splunk Devpost form, but the final Devpost project URL is not recorded yet. The public Splunk Devpost page still showed `Submissions open soon` during the latest local status check on 2026-05-18.

## Recommended Track

Primary track: **Platform & Developer Experience**

Backup track: **Observability**

Why: AgentOps Ledger helps agent builders and platform teams turn hidden agent behavior into searchable operational evidence. The Splunk integration takes run events from an enterprise-agent workflow and makes them available as `agentops:run_event` telemetry for search, alerting, and incident-style investigation.

Official hackathon page: https://splunk.devpost.com/

## Project

Title:
AgentOps Ledger

Tagline:
Turn every enterprise-agent run into Splunk-ready operational telemetry.

Description:
AgentOps Ledger is a flight recorder for enterprise agents. It records tool calls, approval gates, retries, errors, x402-style payments, and final outcomes in one append-only run ledger. The dashboard lets teams inspect recent runs, drill into event timelines, see risk flags, and export a complete audit JSON packet.

For Splunk, the HEC adapter exports selected runs into Splunk as `agentops:run_event` telemetry. Once indexed, teams can search failed runs, alert on rejected approvals, correlate paid API spend with incidents, and review agent behavior with the same evidence humans see in the dashboard.

The public Splunk investigation pack adds reusable SPL searches, Splunk AI Assistant / MCP prompt templates, and a Splunk MCP tool map that ties each investigation to Splunk MCP Server's `splunk_run_query` search tool. The common questions are practical: what happened in a run, where approval gates rejected an action, which tools failed, and where payments were blocked or retried.

## How AI And Agents Are Used

The tool instruments AI agent workflows at the execution layer. Agents call SDK helpers such as `startRun`, `trackToolCall`, `trackApproval`, `trackPayment`, and `finishRun`.

The demo models a vendor-risk agent that:

- searches vendor records
- requests human approval before paid enrichment
- retries a flaky tool call
- records a blocked high-risk payment after human rejection
- emits final run status and audit JSON

AgentOps Ledger is framework-neutral: LangGraph, CrewAI, MCP-based tools, custom scripts, or x402-enabled agents can emit the same run evidence.

## How Splunk Is Used

`adapters/splunk-hec/export-run-to-hec.mjs` calls AgentOps Ledger's `/api/runs/:run_id/export` endpoint, transforms every run event into HEC JSON, and posts newline-delimited events to `/services/collector/event`.

The exported events use:

- `index=agentops`
- `source=agentops-ledger`
- `sourcetype=agentops:run_event`
- stable `run_id`
- event type, status, amount, risk, approval, and tool metadata

The public proof packet documents a local Splunk Enterprise run where `run_demo_vendor_blocked` indexed as five `agentops-ledger` events.

The Splunk MCP tool map shows how the same `agentops:run_event` searches map to the official Splunk MCP Server `splunk_run_query` tool.

## Public Evidence Links

- Repository: https://github.com/Bortlesboat/x402-insights
- Hosted demo: https://bortlesboat.github.io/x402-insights/
- Case study: https://bortlesboat.github.io/x402-insights/case-study.html
- Hosted video: https://youtu.be/De8c_IgCueU
- Architecture: https://github.com/Bortlesboat/x402-insights/blob/main/ARCHITECTURE.md
- Splunk HEC proof: https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-hec-proof.md
- Splunk investigation pack: https://github.com/Bortlesboat/x402-insights/tree/main/adapters/splunk-hec/investigation-pack
- Splunk MCP tool map: https://github.com/Bortlesboat/x402-insights/blob/main/adapters/splunk-hec/investigation-pack/splunk-mcp-tool-map.md
- Video hosting package: https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/video-hosting.md
- Public submission/outcome tracker: https://github.com/Bortlesboat/x402-insights/issues/10

## Built With

- Node.js
- Express
- SQLite
- TypeScript SDK helpers
- Vanilla HTML/CSS/JS dashboard
- x402-style payment telemetry
- Splunk HTTP Event Collector
- Splunk SPL searches
- Splunk MCP Server alignment through `splunk_run_query`

## Submission Boundary

No MCP execution proof is claimed.

No Splunk AI Assistant execution proof is claimed.

No Hosted Models execution proof is claimed.

No prize, finalist, acceptance, gallery, or judging outcome is claimed.

The verified public proof is the HEC indexing path plus a reusable investigation pack and MCP tool map over indexed `agentops:run_event` data.
