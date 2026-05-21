# Agent Payment Ledger AI Investigation Prompts

Use these with Splunk AI Assistant, Splunk MCP Server, or another Splunk-connected investigation agent after Agent Payment Ledger events are indexed as `agentops:run_event`.

## Run Timeline

```text
Search Splunk for sourcetype=agentops:run_event and run_id=run_demo_vendor_blocked. Summarize the ordered run timeline, including tool calls, approval gates, payment events, retries, errors, and final status.
```

## Failed Agent Runs

```text
Using sourcetype=agentops:run_event, find failed agent runs in index=agentops. Group by run_id, agent, workflow, tool_name, and endpoint. Explain which tools or endpoints appear unstable.
```

## Rejected Approvals

```text
Using sourcetype=agentops:run_event, find rejected approvals. For each run_id, explain what action was blocked, which step requested approval, and what an operator should review next.
```

## Blocked Payments

```text
Using sourcetype=agentops:run_event, find blocked payments and spend-bearing events. Highlight total cost, approval state, endpoint, and whether the payment should be reviewed by finance, security, or platform engineering.
```

## Retry Waste

```text
Using sourcetype=agentops:run_event, find events with is_retry=1 or retry_count>0. Summarize retry-heavy workflows and estimate which tools create the most operational waste.
```
