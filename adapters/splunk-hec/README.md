# Splunk HEC Adapter

Export one AgentOps Ledger run into Splunk through HTTP Event Collector.

```powershell
$env:AGENTOPS_BASE_URL = "http://localhost:4000"
$env:AGENTOPS_RUN_ID = "run_demo_vendor_blocked"
$env:SPLUNK_HEC_URL = "https://splunk.example:8088"
$env:SPLUNK_HEC_TOKEN = "<hec-token>"
$env:SPLUNK_INDEX = "agentops"

node adapters/splunk-hec/export-run-to-hec.mjs
```

If `SPLUNK_HEC_URL` is a base Splunk URL, the adapter appends `/services/collector/event`. You can also pass the full HEC event endpoint.

The adapter sends each AgentOps event as newline-delimited HEC JSON with `source=agentops-ledger` and `sourcetype=agentops:run_event`.

## Investigation Pack

The `investigation-pack/` directory adds reusable SPL searches and AI prompt templates for Splunk AI Assistant or Splunk MCP Server workflows.

- `investigation-pack/searches.json`: run timeline, rejected approvals, failed tools, payment risk, and retry/error summaries.
- `investigation-pack/agentops-ai-prompts.md`: paste-ready investigation prompts for `agentops:run_event` data.

The pack is intentionally honest: the verified public proof covers HEC indexing into Splunk Enterprise, while these prompts show the next investigation layer for Splunk AI tooling.

## Test

```powershell
node adapters/splunk-hec/test-export-run-to-hec.mjs
node adapters/splunk-hec/test-investigation-pack.mjs
```

Expected:

```text
splunk hec export test passed
splunk investigation pack test passed
```
