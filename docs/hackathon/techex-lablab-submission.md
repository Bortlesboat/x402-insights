# TechEx/lablab Transforming Enterprise Through AI Submission Packet

## Source And Fit

- Official event: https://lablab.ai/ai-hackathons/techex-intelligent-enterprise-solutions-hackathon
- Event dates: May 11-19, 2026
- Prize pool: $10,000 prize pool
- Primary fit: Track 1: Agent Security & AI Governance
- Secondary fit: B2B FinOps & Compliance
- Submission status: No lablab submission proof is claimed yet.

The official page asks builders to prototype enterprise-ready AI systems and names agent monitoring, observability, access control, audit trails, explainability tooling, and x402 payment/compliance workflows as relevant challenge areas. Agent Payment Ledger fits as an enterprise-agent audit and operations layer that records tool calls, approval gates, retries, errors, x402 payment telemetry, and final outcomes.

## Honest Boundary

No Gemini, Veea Lobster Trap, or lablab platform execution proof is claimed. The current artifact is a public, working Agent Payment Ledger package with x402 payment telemetry, Splunk-ready run evidence, hosted video, and public docs. A lablab submission would be a submission of this current public artifact, not proof that the project has executed through Gemini, Veea Lobster Trap, Native.Builder, or lablab infrastructure.

No prize or judging outcome is claimed.

## Basic Information

### Project Title

Agent Payment Ledger

### Short Description

Enterprise-agent flight recorder for tool calls, approvals, retries, errors, x402 payment telemetry, and audit-ready outcomes.

### Long Description

Agent Payment Ledger is an operational evidence layer for enterprise agents. Most agent demos show the final answer; production teams need the run record behind it. This project records every tool call, human approval, retry, error, x402-style payment event, and final outcome into an inspectable ledger.

The hosted demo shows a vendor-risk workflow with a successful approval-gated run, a retry after a flaky tool, and a high-risk paid enrichment blocked by human review. The local server groups events into runs, computes risk flags, renders a dashboard, exports audit JSON, and can forward run events to Splunk HEC as `agentops:run_event` telemetry.

For TechEx/lablab, the strongest fit is enterprise AI governance and B2B FinOps compliance. Agent Payment Ledger gives security, finance, and platform teams a durable answer to the questions that matter before agents touch real systems: what did the agent do, what did it spend, where did it fail, and where did a human stay in control?

## Technology & Category Tags

- Enterprise AI
- Agent Security
- AI Governance
- Agent Observability
- Audit Trails
- x402 Payments
- B2B FinOps
- Compliance
- Splunk
- Node.js
- SQLite
- TypeScript

## Cover Image

Use the existing public thumbnail:

https://bortlesboat.github.io/x402-insights/agentops-ledger-video-thumbnail.png

## Video Presentation

Hosted video:

https://youtu.be/De8c_IgCueU

## Slide Presentation

Public slide page:

https://bortlesboat.github.io/x402-insights/hackathon/techex-lablab-slides.html

## App Hosting & Code Repository

### Public GitHub Repository

https://github.com/Bortlesboat/x402-insights

### Demo Application Platform

GitHub Pages static demo backed by a Node.js/Express/SQLite local runtime and public repository.

### Application URL

https://bortlesboat.github.io/x402-insights/

## Additional Evidence Links

- Launch page: https://bortlesboat.github.io/x402-insights/launch.html
- Case study: https://bortlesboat.github.io/x402-insights/case-study.html
- Architecture: https://github.com/Bortlesboat/x402-insights/blob/main/ARCHITECTURE.md
- Splunk HEC proof: https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-hec-proof.md
- Splunk investigation pack: https://github.com/Bortlesboat/x402-insights/tree/main/adapters/splunk-hec/investigation-pack
- Splunk MCP tool map: https://github.com/Bortlesboat/x402-insights/blob/main/adapters/splunk-hec/investigation-pack/splunk-mcp-tool-map.md
- Public tracker: https://github.com/Bortlesboat/x402-insights/issues/10

## Suggested Track Framing

### Track 1: Agent Security & AI Governance

Agent Payment Ledger provides monitoring, observability, access-review evidence, approval history, payment controls, and audit trails for agent workflows. It is not a model wrapper. It is the operational evidence layer around agents that touch tools, payments, and external systems.

### B2B FinOps & Compliance

The x402 payment telemetry angle makes the project useful for businesses that need real-time visibility into agent-initiated payment activity. The ledger records payment endpoint, provider, phase, currency, cost, approval status, retries, and final outcome so finance and platform teams can audit automated spend.

## Submission Checklist

- Project Title: Agent Payment Ledger
- Short Description: ready
- Long Description: ready
- Technology & Category Tags: ready
- Cover Image: public URL ready
- Video Presentation: public YouTube URL ready
- Slide Presentation: public URL ready
- Public GitHub Repository: ready
- Demo Application Platform: ready
- Application URL: ready
- lablab account/form submission: not completed
- Outcome claim: not claimed
