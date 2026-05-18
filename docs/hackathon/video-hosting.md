# AgentOps Ledger Video Hosting Package

Use this package to turn the captioned GitHub release MP4 into a Devpost-compatible YouTube, Vimeo, or Youku URL for Splunk Agentic Ops and follow-on hackathon submissions.

## Source Asset

- Captioned MP4: https://github.com/Bortlesboat/x402-insights/releases/download/agentops-ledger-2026-05-18/agentops-ledger-demo-46s.mp4
- Public release: https://github.com/Bortlesboat/x402-insights/releases/tag/agentops-ledger-2026-05-18
- Thumbnail PNG: https://bortlesboat.github.io/x402-insights/agentops-ledger-video-thumbnail.png
- Thumbnail source: https://github.com/Bortlesboat/x402-insights/blob/main/docs/agentops-ledger-video-thumbnail.html

## Recommended Upload Fields

Title:

```text
AgentOps Ledger: Enterprise Agent Flight Recorder
```

Short description:

```text
AgentOps Ledger records enterprise-agent tool calls, approval gates, retries, errors, x402-style payments, and final outcomes in one inspectable run ledger.
```

Full description:

```text
AgentOps Ledger is a flight recorder for enterprise agents.

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

Use `agentops-ledger-video-thumbnail.png` as the upload thumbnail. It is a 1280x720 static thumbnail that shows the actual AgentOps Ledger dashboard, the product name, and the enterprise-agent evidence angle.

If the host requires regeneration, open `docs/agentops-ledger-video-thumbnail.html` at 1280x720 and capture a full-page screenshot to `docs/agentops-ledger-video-thumbnail.png`.

## Upload Checklist

- [ ] Upload the captioned MP4 to YouTube, Vimeo, or Youku.
- [ ] Set the title to `AgentOps Ledger: Enterprise Agent Flight Recorder`.
- [ ] Paste the full description above.
- [ ] Add the tags above.
- [ ] Set the thumbnail to `agentops-ledger-video-thumbnail.png`.
- [ ] Confirm captions are visible in the uploaded playback.
- [ ] Copy the final hosted video URL.
- [ ] Add the hosted video URL to Splunk Agentic Ops Devpost.
- [ ] Record the hosted video URL in https://github.com/Bortlesboat/x402-insights/issues/10.

## Devpost Video Field

Paste only the final YouTube, Vimeo, or Youku URL into Devpost. Keep the GitHub release MP4 as backup evidence, but do not rely on it for Splunk Agentic Ops because Devpost asks for a video hosted on YouTube, Vimeo, or Youku.

## Splunk Agentic Ops Companion Links

- Project URL: https://bortlesboat.github.io/x402-insights/
- Public repository: https://github.com/Bortlesboat/x402-insights
- Public case study: https://bortlesboat.github.io/x402-insights/case-study.html
- Architecture diagram: https://github.com/Bortlesboat/x402-insights/blob/main/ARCHITECTURE.md
- Splunk HEC adapter: https://github.com/Bortlesboat/x402-insights/tree/main/adapters/splunk-hec
- Splunk indexed proof: https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-hec-proof.md
- Public submission/outcome tracker: https://github.com/Bortlesboat/x402-insights/issues/10

