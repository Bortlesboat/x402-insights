# Agent Payment Ledger Video Hosting Package

This package documents the Devpost-compatible YouTube upload for Splunk Agentic Ops and follow-on hackathon submissions.

## Hosted Video

- Public YouTube URL: https://youtu.be/De8c_IgCueU
- Title: `Agent Payment Ledger: Paid-Agent Audit Trail`
- Duration: 46 seconds
- Public no-login verification: YouTube oEmbed returns the expected title.

## Source Asset

- Captioned MP4: https://github.com/Bortlesboat/x402-insights/releases/download/agentops-ledger-2026-05-18/agentops-ledger-demo-46s.mp4
- Public release: https://github.com/Bortlesboat/x402-insights/releases/tag/agentops-ledger-2026-05-18
- Thumbnail PNG: https://bortlesboat.github.io/x402-insights/agentops-ledger-video-thumbnail.png
- Thumbnail source: https://github.com/Bortlesboat/x402-insights/blob/main/docs/agentops-ledger-video-thumbnail.html

## Recommended Upload Fields

Title:

```text
Agent Payment Ledger: Paid-Agent Audit Trail
```

Short description:

```text
Agent Payment Ledger records paid-agent tool calls, approval gates, retries, errors, x402-style payments, and final outcomes in one inspectable run ledger.
```

Full description:

```text
Agent Payment Ledger is a payment-aware audit trail for autonomous agents.

The demo shows a vendor-risk workflow with three inspectable runs: one success after human approval, one flaky tool retry, and one high-risk payment blocked by a rejected approval. Each run records the operational evidence enterprise teams need before agents touch real systems: tool calls, approval gates, errors, retries, paid API events, final outcomes, risk flags, and exportable audit JSON.

For Splunk Agentic Ops, the repo includes a Splunk HEC adapter that exports selected runs as agentops:run_event telemetry for search, alerting, and investigation.

Hosted demo: https://bortlesboat.github.io/x402-insights/
Case study: https://bortlesboat.github.io/x402-insights/case-study.html
Repository: https://github.com/Bortlesboat/x402-insights
Architecture: https://github.com/Bortlesboat/x402-insights/blob/main/ARCHITECTURE.md
Splunk HEC proof: https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-hec-proof.md
Submission/outcome tracker: https://github.com/Bortlesboat/x402-insights/issues/10
```

Tags:

```text
agentops, enterprise agents, agent observability, ai agents, splunk, splunk hec, x402, audit log, hackathon, devpost
```

Category:

```text
Science & Technology
```

Visibility:

```text
Public or unlisted. Use public for portfolio credibility unless the platform/account context makes unlisted safer.
```

## Thumbnail

Use `agentops-ledger-video-thumbnail.png` as the upload thumbnail. It is a 1280x720 static thumbnail that shows the actual Agent Payment Ledger dashboard, the product name, and the paid-agent evidence angle.

If the host requires regeneration, open `docs/agentops-ledger-video-thumbnail.html` at 1280x720 and capture a full-page screenshot to `docs/agentops-ledger-video-thumbnail.png`.

## Upload Checklist

- [x] Upload the captioned MP4 to YouTube, Vimeo, or Youku.
- [x] Set the title to `Agent Payment Ledger: Paid-Agent Audit Trail`.
- [x] Paste the full description above.
- [ ] Add the tags above.
- [x] Set the thumbnail to `agentops-ledger-video-thumbnail.png`.
- [x] Copy the final hosted video URL: https://youtu.be/De8c_IgCueU.
- [x] Record the hosted video URL in https://github.com/Bortlesboat/x402-insights/issues/10.
- [ ] Add the hosted video URL to Splunk Agentic Ops Devpost.

## Devpost Video Field

Paste this URL into Devpost:

```text
https://youtu.be/De8c_IgCueU
```

Keep the GitHub release MP4 as backup evidence, but do not rely on it for Splunk Agentic Ops because Devpost asks for a video hosted on YouTube, Vimeo, or Youku.

## Splunk Agentic Ops Companion Links

- Project URL: https://bortlesboat.github.io/x402-insights/
- Public video: https://youtu.be/De8c_IgCueU
- Public repository: https://github.com/Bortlesboat/x402-insights
- Public case study: https://bortlesboat.github.io/x402-insights/case-study.html
- Architecture diagram: https://github.com/Bortlesboat/x402-insights/blob/main/ARCHITECTURE.md
- Splunk HEC adapter: https://github.com/Bortlesboat/x402-insights/tree/main/adapters/splunk-hec
- Splunk indexed proof: https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-hec-proof.md
- Public submission/outcome tracker: https://github.com/Bortlesboat/x402-insights/issues/10
