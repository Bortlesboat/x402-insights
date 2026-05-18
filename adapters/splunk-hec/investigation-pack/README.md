# AgentOps Ledger Splunk Investigation Pack

This pack turns AgentOps Ledger `agentops:run_event` telemetry into reusable Splunk searches and AI investigation prompts.

It assumes runs have been exported through the AgentOps Ledger Splunk HTTP Event Collector adapter with:

- `source=agentops-ledger`
- `sourcetype=agentops:run_event`
- `index=agentops`

The proof run used during packaging was `run_demo_vendor_blocked`, a human-in-the-loop vendor-risk workflow where a high-risk payment was blocked by a rejected approval.

## Files

- `searches.json`: reusable SPL searches for run timelines, rejected approval gates, failed tool calls, payment risk events, and retry/error summaries.
- `agentops-ai-prompts.md`: prompt templates for Splunk AI Assistant or Splunk MCP Server workflows.

## Use With Splunk AI Assistant

1. Export a run with `node adapters/splunk-hec/export-run-to-hec.mjs`.
2. Open Splunk Search.
3. Run one of the SPL searches in `searches.json`.
4. Ask Splunk AI Assistant to summarize the result set using the matching `ai_assistant_prompt`.

Example:

```text
Using sourcetype=agentops:run_event, explain the timeline for run_id=run_demo_vendor_blocked. Call out tool calls, approval gates, payment events, retries, errors, and the final outcome.
```

## Use With Splunk MCP Server

Point an MCP-capable agent at Splunk, then use the matching `mcp_prompt` from `searches.json`.

Example:

```text
Search Splunk for sourcetype=agentops:run_event and run_id=run_demo_vendor_blocked. Summarize the ordered run timeline and identify any risky or human-in-the-loop events.
```

## Included Investigations

| Search | Purpose |
|---|---|
| Run timeline by run_id | Inspect one run in execution order. |
| Rejected approval gates | Find human decisions that blocked agent actions. |
| Failed tool calls by tool | Rank fragile integrations by failed calls. |
| Payment risk events | Review spend-bearing, blocked, or failed payment events. |
| Agent run error and retry summary | Triage retry-heavy or failed agent runs. |

## Boundary

This pack is a submission aid and operational starter kit. It does not claim that Splunk AI Assistant or Splunk MCP Server executed these prompts during the public proof. The verified proof is the HEC indexing path documented in `docs/hackathon/splunk-hec-proof.md`.
