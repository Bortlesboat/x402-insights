# Microsoft Agent Academy Hackathon Special Ops Packet

Status: Not submitted.

AgentOps Ledger is being prepared for the Microsoft Agent Academy Hackathon as a Special Ops route, not claimed as an entered project yet.

## Official Source Facts

- Event: Microsoft Agent Academy Hackathon
- Dates: May 12-June 2, 2026
- Prize pool: $12,000
- Track fit: Special Ops
- Official page: https://microsoft.github.io/agent-academy/events/hackathon/
- Submission path: GitHub issue template at https://aka.ms/agent-academy-hack/submit
- Required Microsoft ecosystem component: Microsoft Graph API, Azure OpenAI Service, Copilot Studio, Power Automate, or another official Microsoft AI ecosystem component named by the rules.

## Why AgentOps Ledger Fits Special Ops

AgentOps Ledger is infrastructure for making agent behavior inspectable. It records tool calls, approval gates, retries, errors, x402-style payments, external-system use, and final outcomes in one local run ledger.

The Special Ops track explicitly fits advanced scenarios such as MCP integrations, external systems, advanced actions, structured outputs, and evaluation patterns. AgentOps Ledger turns those patterns into reviewable evidence.

## Microsoft Graph API Route

Public adapter:

https://github.com/Bortlesboat/x402-insights/tree/main/adapters/microsoft-graph

The adapter probes the public Microsoft Graph API metadata endpoint:

```text
https://graph.microsoft.com/v1.0/$metadata
```

It emits an AgentOps Ledger run named `run_microsoft_graph_metadata_probe` for `agent-academy-special-ops-agent`, with a `microsoft.graph.metadata` tool-call event and a no-approval-required event explaining that no tenant, user, or payment data was accessed.

Public live probe evidence:

https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/microsoft-graph-metadata-probe.json

This is the smallest safe Microsoft ecosystem proof path because it uses Microsoft Graph API without requiring a tenant token, account session, or private data.

## Submission Copy

Title:
AgentOps Ledger

Track:
Special Ops

Short description:
AgentOps Ledger is a flight recorder for enterprise agents. It records tool calls, approvals, retries, errors, Microsoft Graph API probes, x402-style payments, and final outcomes as inspectable run evidence.

Target user:
Platform, security, and operations teams that need to understand what an enterprise agent did before trusting it with external systems.

Microsoft component:
Microsoft Graph API. The public adapter probes `https://graph.microsoft.com/v1.0/$metadata` and records the call as AgentOps Ledger run evidence without accessing tenant or user data.

Demo video:
https://youtu.be/De8c_IgCueU

Repository:
https://github.com/Bortlesboat/x402-insights

Hosted demo:
https://bortlesboat.github.io/x402-insights/

Launch page:
https://bortlesboat.github.io/x402-insights/launch.html

Architecture:
https://github.com/Bortlesboat/x402-insights/blob/main/ARCHITECTURE.md

## Boundary

No Microsoft Agent Academy GitHub issue submission has been created yet. No badge, winner, finalist, or prize outcome is claimed. A valid entry still needs the authorized account holder to create the official GitHub issue submission and complete any required registration or badge validation steps.
