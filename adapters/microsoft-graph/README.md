# Microsoft Graph Adapter

This adapter opens a narrow Microsoft Agent Academy route for AgentOps Ledger by probing the public Microsoft Graph API metadata endpoint and converting that tool call into AgentOps Ledger run evidence.

```powershell
node adapters/microsoft-graph/graph-metadata-probe.mjs --json
```

The probe calls:

```text
https://graph.microsoft.com/v1.0/$metadata
```

It emits a run named `run_microsoft_graph_metadata_probe` for `agent-academy-special-ops-agent` with a `microsoft.graph.metadata` tool-call event, risk flags for `external_system`, `read_only_metadata`, and `no_user_data`, plus an approval event explaining that no approval is required because the endpoint contains no tenant, user, or payment data.

Public evidence JSON:

```text
docs/hackathon/microsoft-graph-metadata-probe.json
```

This is intentionally credential-free:

- no access token
- no tenant data
- no user data
- no payment data
- no Microsoft account session

## Why This Exists

The Microsoft Agent Academy Hackathon requires a working agent aligned with the Microsoft AI ecosystem. Microsoft Graph API is one listed Microsoft service in the official rules. This adapter gives reviewers a small, inspectable way to see how AgentOps Ledger records a Microsoft Graph tool call without exposing secrets.

## Test

```powershell
node adapters/microsoft-graph/test-graph-metadata-probe.mjs
```

Expected:

```text
microsoft graph metadata probe test passed
```

Boundary: this adapter is not itself proof of a submitted Microsoft Agent Academy entry, badge, finalist status, winner status, or prize outcome.
