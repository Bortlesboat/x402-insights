# Splunk HEC Proof

This proof shows AgentOps Ledger events exported into a real local Splunk Enterprise instance through HTTP Event Collector (HEC). It is intended as supporting evidence for Splunk Agentic Ops and other enterprise-agent infrastructure submissions.

## Environment

- Splunk container: `splunk/splunk:latest`
- Splunk Web: `http://127.0.0.1:8000`
- HEC listener: `http://127.0.0.1:8088/services/collector/event`
- AgentOps Ledger server: `http://127.0.0.1:4311`
- AgentOps run exported: `run_demo_vendor_blocked`
- Splunk index: `agentops`
- Splunk source: `agentops-ledger`
- Splunk sourcetype: `agentops:run_event`

Secrets such as local admin passwords and HEC tokens are intentionally omitted.

## AgentOps Run Export

The deterministic demo seed created three runs. The blocked run was exported:

```text
run_id: run_demo_vendor_blocked
agent: expense-control-agent
workflow: high-risk-payment-review
status: error
summary: Payment blocked by human approval gate.
events: 5
approvals: 2
errors: 1
```

## HEC Export Command

The Splunk HEC adapter was run with local environment variables:

```powershell
$env:AGENTOPS_BASE_URL = "http://127.0.0.1:4311"
$env:AGENTOPS_RUN_ID = "run_demo_vendor_blocked"
$env:SPLUNK_HEC_URL = "http://127.0.0.1:8088"
$env:SPLUNK_INDEX = "agentops"

node adapters/splunk-hec/export-run-to-hec.mjs
```

Verified output:

```text
Exported 5 AgentOps Ledger events for run_demo_vendor_blocked to Splunk HEC
```

## Splunk Indexed Evidence

Splunk CLI query:

```text
| tstats count earliest(_time) as first latest(_time) as last where index=agentops by sourcetype source
| convert ctime(first) ctime(last)
```

Verified output:

```text
    sourcetype         source      count        first               last
------------------ --------------- ----- ------------------- -------------------
agentops:run_event agentops-ledger     5 05/18/2026 05:04:27 05/18/2026 05:04:31
agentops:run_event manual              1 05/18/2026 05:21:54 05/18/2026 05:21:54
```

The `agentops-ledger` row is the actual AgentOps Ledger export. The `manual` row is a separate one-event HEC probe used to isolate the local HEC/index setup during verification.

## Why This Matters

AgentOps Ledger does not only render a local dashboard. It can forward enterprise-agent run evidence into Splunk as operational telemetry. Once indexed, teams can build searches, alerts, and investigations around agent behavior:

- rejected human approvals
- failed tool calls
- high-risk run outcomes
- x402-style paid API calls
- retry and error patterns
- run-level audit trails by agent and workflow

This is the key Splunk Agentic Ops claim: every agent run becomes searchable operational evidence.

