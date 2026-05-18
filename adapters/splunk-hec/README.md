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

## Test

```powershell
node adapters/splunk-hec/test-export-run-to-hec.mjs
```

Expected:

```text
splunk hec export test passed
```
