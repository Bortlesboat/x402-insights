# Splunk MCP Tool Map

This file maps the Agent Payment Ledger investigation pack to the official Splunk MCP Server vocabulary without claiming that the public proof executed MCP calls.

## Official Alignment

The official Splunk MCP Server documentation describes the server as a secure interface for connecting AI assistants, agents, and intelligent systems with Splunk platform data. The documented core search tool is `splunk_run_query`, which executes SPL and returns results. Splunk MCP tools are namespaced with `splunk_` for core Splunk platform tools and `saia_` for Splunk AI Assistant for SPL tools.

Useful public references:

- Splunk MCP Server overview: https://help.splunk.com/en/splunk-cloud-platform/mcp-server-for-splunk-platform/about-mcp-server-for-splunk-platform
- Splunk MCP Server tools: https://help.splunk.com/en/splunk-enterprise/mcp-server-for-splunk-platform/mcp-server-tools
- Splunk Agentic Ops Hackathon: https://splunk.devpost.com/

## Payment-Ledger Query Mapping

All searches in `searches.json` target verified Agent Payment Ledger telemetry exported through HTTP Event Collector with historical evidence names:

- `index=agentops`
- `source=agentops-ledger`
- `sourcetype=agentops:run_event`

Each search includes:

- `spl`: the SPL query body.
- `mcp_tool`: `splunk_run_query`.
- `mcp_prompt`: an agent-facing instruction for an MCP-capable client.
- `ai_assistant_prompt`: an analyst prompt for Splunk AI Assistant for SPL.

| Search id | Official MCP tool | What the agent asks Splunk to inspect |
|---|---|---|
| `run-timeline-by-run-id` | `splunk_run_query` | Ordered event timeline for `run_demo_vendor_blocked` or another selected `run_id`. |
| `rejected-approval-gates` | `splunk_run_query` | Human approval gates where an agent action was rejected or blocked. |
| `failed-tool-calls-by-tool` | `splunk_run_query` | Fragile tools/endpoints causing failed agent runs. |
| `payment-risk-events` | `splunk_run_query` | Spend-bearing, failed, retried, or blocked x402-style payment events. |
| `agent-run-error-and-retry-summary` | `splunk_run_query` | Runs with retries, tool errors, and SRE triage indicators. |

## Optional AI Assistant Layer

If Splunk AI Assistant for SPL is installed, an operator can use the `ai_assistant_prompt` fields after running the matching SPL search. If a Splunk MCP client exposes `saia_` tools, those can be layered on top to generate, explain, or optimize SPL. This pack keeps the base integration on `splunk_run_query` because the public proof already verifies indexed `agentops:run_event` data and reusable SPL.

## Verification Boundary

Verified public proof:

- Agent Payment Ledger exported `run_demo_vendor_blocked` through Splunk HEC.
- Splunk indexed five `agentops-ledger` events as `agentops:run_event`.
- The public proof packet documents the indexed telemetry path.

This file does not claim MCP execution proof, Splunk AI Assistant execution proof, Hosted Models execution proof, judging status, or prize outcome. It is a submission aid that shows exactly how the existing payment-ledger telemetry maps to official Splunk MCP Server tools once a logged-in Splunk MCP environment is available.
