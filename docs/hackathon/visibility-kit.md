# AgentOps Ledger Visibility Kit

## Primary Launch Goal

Use AgentOps Ledger to create visible proof that x402-insights is no longer only payment telemetry. It is an enterprise-agent infrastructure tool: a flight recorder for tool calls, approvals, retries, errors, payments, and final outcomes.

## Audience

- Enterprise agent builders
- MCP/tooling developers
- Agent ops and SRE teams
- Hackathon judges looking for practical infrastructure
- x402 builders who already understand paid agent workflows

## Core Message

Agents do not just need better models. They need a trustworthy run record.

AgentOps Ledger gives every enterprise agent a local audit trail: what it did, what it spent, where it failed, and where a human stayed in control.

## X Launch Post

```text
Built AgentOps Ledger: a flight recorder for enterprise agents.

It records every tool call, approval gate, retry, error, payment, and final outcome in one local audit trail.

The demo shows 3 vendor-risk runs:
- success after human approval
- retry after a flaky tool
- blocked high-risk payment

The useful part is not the final answer. It is the run evidence.
```

Attach `docs/agentops-ledger-dashboard.png`.

## X Follow-Up Thread

```text
1/ Enterprise teams will not trust agents that touch real systems unless they can inspect what happened.

The hard questions are simple:
- What did the agent do?
- What did it spend?
- Where did it fail?
- Where did a human approve or reject action?

2/ AgentOps Ledger records those events as an append-only run timeline.

Event types:
- run_start
- step
- tool_call
- approval
- payment
- error
- run_finish

3/ The demo workflow is a vendor-risk review agent.

It searches vendor records, calls enrichment tools, asks for human approval, records x402-style payment events, and exports audit JSON for the run.

4/ The x402 angle still matters.

Payment events are just one event type in the broader agent ledger. That means paid API calls, settlement latency, retries, and spend can sit next to normal tool calls and approval gates.

5/ This is built for 2026 agent hackathons where the frontier is not another chat UI.

The frontier is production infrastructure: observability, controls, auditability, and safe integration with real systems.
```

## LinkedIn Post

```text
I built AgentOps Ledger, a local-first flight recorder for enterprise agents.

Most agent demos show the final answer. That is not enough for real workflows.

If an agent can call tools, spend money, retry failed actions, or wait for human approval, teams need a run record they can inspect later.

AgentOps Ledger records:
- tool calls
- approval gates
- retries and errors
- payment/spend events
- final outcomes
- exportable audit JSON

The demo is a vendor-risk review workflow: one successful run, one retry run, and one high-risk payment blocked by human approval.

The point is simple: before agents become production systems, they need operational evidence.
```

Attach `docs/agentops-ledger-dashboard.png`.

## Demo Video Outline

Target length: 90 seconds.

1. Show the problem: "The final answer hides the operational risk."
2. Show the SDK snippet in README.
3. Run or describe `npm run seed`.
4. Open the dashboard and click the blocked payment run.
5. Show the approval request, rejection, final error, and risk flag.
6. Click the successful run and show the payment event.
7. Click export JSON.
8. Close with: "AgentOps Ledger makes agents inspectable before they become production systems."

## Short Devpost/NandaHack Copy

```text
AgentOps Ledger is a flight recorder for enterprise agents. It records every tool call, approval gate, retry, error, payment, and final outcome in one local audit trail.

The demo uses a vendor-risk review agent with three runs: a successful approval-gated workflow, a flaky tool retry, and a high-risk payment blocked by human approval.

The result is a dashboard and exportable audit JSON that answers the questions enterprise teams ask before trusting agents with real systems: what did it do, what did it spend, where did it fail, and where did a human stay in control?
```

## Visibility Sequence

1. Merge PR to main.
2. Record the 90-second demo video.
3. Submit to NandaHack as primary.
4. Repurpose the same repo/demo for Splunk Agentic Ops and Google Rapid Agent if eligible.
5. Post X launch thread with screenshot.
6. Post LinkedIn version the next morning.
7. Share in x402 community only after the repo main branch is polished.

## Proof Assets

- Public repo: https://github.com/Bortlesboat/x402-insights
- Public demo release: https://github.com/Bortlesboat/x402-insights/releases/tag/agentops-ledger-2026-05-18
- Public demo MP4: https://github.com/Bortlesboat/x402-insights/releases/download/agentops-ledger-2026-05-18/agentops-ledger-demo-46s.mp4
- Dashboard screenshot: `docs/agentops-ledger-dashboard.png`
- Mobile screenshot: `docs/agentops-ledger-mobile.png`
- Submission draft: `docs/hackathon/agentops-ledger-submission.md`
- Design spec: `docs/superpowers/specs/2026-05-18-agentops-ledger-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-18-agentops-ledger.md`
