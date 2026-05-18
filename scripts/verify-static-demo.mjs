import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
const caseStudy = await readFile(new URL("../docs/case-study.html", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const submission = await readFile(new URL("../docs/hackathon/agentops-ledger-submission.md", import.meta.url), "utf8");
const videoHosting = await readFile(new URL("../docs/hackathon/video-hosting.md", import.meta.url), "utf8");
const thumbnailSource = await readFile(new URL("../docs/agentops-ledger-video-thumbnail.html", import.meta.url), "utf8");
const thumbnailPng = await readFile(new URL("../docs/agentops-ledger-video-thumbnail.png", import.meta.url));
const thumbnailStats = await stat(new URL("../docs/agentops-ledger-video-thumbnail.png", import.meta.url));
const investigationSearches = await readFile(
  new URL("../adapters/splunk-hec/investigation-pack/searches.json", import.meta.url),
  "utf8",
);

const trackerUrl = "https://github.com/Bortlesboat/x402-insights/issues/10";
const videoHostingUrl = "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/video-hosting.md";
const investigationPackUrl = "https://github.com/Bortlesboat/x402-insights/tree/main/adapters/splunk-hec/investigation-pack";

const requiredSnippets = [
  "AgentOps Ledger",
  "flight recorder for enterprise agents",
  "agentops-ledger-dashboard.png",
  "https://bortlesboat.github.io/x402-insights/",
  "https://bortlesboat.github.io/x402-insights/agentops-ledger-dashboard.png",
  'property="og:title"',
  'property="og:description"',
  'property="og:image"',
  'property="og:url"',
  'name="twitter:card"',
  'name="twitter:image"',
  'rel="canonical"',
  "ARCHITECTURE.md",
  "agentops-ledger-demo-46s.mp4",
  "adapters/splunk-hec",
  "docs/hackathon/splunk-hec-proof.md",
  "adapters/splunk-hec/investigation-pack",
  "docs/hackathon/video-hosting.md",
  "agentops-ledger-video-thumbnail.png",
  "Indexed Splunk proof",
  "startRun",
  "trackToolCall",
  "trackApproval",
  "trackPayment",
  "finishRun",
  "NandaHack",
  "Splunk Agentic Ops",
  "case-study.html",
  trackerUrl,
  videoHostingUrl,
  investigationPackUrl,
];

for (const snippet of requiredSnippets) {
  assert.match(html, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `demo page missing ${snippet}`);
}

assert.match(readme, /https:\/\/bortlesboat\.github\.io\/x402-insights\//, "README must link the hosted demo URL");
assert.match(
  readme,
  /https:\/\/bortlesboat\.github\.io\/x402-insights\/case-study\.html/,
  "README must link the public case study URL",
);
assert.match(
  readme,
  /https:\/\/github\.com\/Bortlesboat\/x402-insights\/issues\/10/,
  "README must link the public submission/outcome tracker",
);
assert.doesNotMatch(html, /C:[/\\]Users/i, "demo page must not expose local Windows paths");
assert.doesNotMatch(caseStudy, /C:[/\\]Users/i, "case study page must not expose local Windows paths");
assert.doesNotMatch(readme, /C:[/\\]Users/i, "README must not expose local Windows paths");
assert.doesNotMatch(submission, /C:[/\\]Users/i, "submission draft must not expose local Windows paths");
assert.doesNotMatch(videoHosting, /C:[/\\]Users/i, "video-hosting package must not expose local Windows paths");
assert.doesNotMatch(thumbnailSource, /C:[/\\]Users/i, "thumbnail source must not expose local Windows paths");

const titleCount = (html.match(/<h1\b/gi) ?? []).length;
assert.equal(titleCount, 1, "demo page should have exactly one h1");

const caseStudyTitleCount = (caseStudy.match(/<h1\b/gi) ?? []).length;
assert.equal(caseStudyTitleCount, 1, "case study page should have exactly one h1");

const caseStudyRequiredSnippets = [
  "AgentOps Ledger case study",
  "Built for 2026 enterprise-agent hackathons",
  "Splunk HEC proof",
  "NandaHack",
  "Devpost video host",
  "Video hosting package",
  "Outcome tracker",
  "https://github.com/Bortlesboat/x402-insights",
  "https://bortlesboat.github.io/x402-insights/",
  "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-hec-proof.md",
  videoHostingUrl,
  trackerUrl,
];

for (const snippet of caseStudyRequiredSnippets) {
  assert.match(
    caseStudy,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `case study page missing ${snippet}`,
  );
}

assert.match(
  submission,
  /https:\/\/github\.com\/Bortlesboat\/x402-insights\/issues\/10/,
  "submission draft must link the public submission/outcome tracker",
);
assert.match(
  submission,
  /https:\/\/github\.com\/Bortlesboat\/x402-insights\/blob\/main\/docs\/hackathon\/video-hosting\.md/,
  "submission draft must link the video-hosting package",
);
assert.match(
  submission,
  /https:\/\/github\.com\/Bortlesboat\/x402-insights\/tree\/main\/adapters\/splunk-hec\/investigation-pack/,
  "submission draft must link the Splunk investigation pack",
);

const parsedInvestigationSearches = JSON.parse(investigationSearches);
assert.ok(Array.isArray(parsedInvestigationSearches), "investigation searches must be an array");
assert.ok(parsedInvestigationSearches.length >= 5, "investigation pack should include at least five searches");
for (const search of parsedInvestigationSearches) {
  assert.match(search.spl, /sourcetype=agentops:run_event/, `investigation search ${search.id} must target AgentOps sourcetype`);
}

const videoHostingRequiredSnippets = [
  "AgentOps Ledger Video Hosting Package",
  "YouTube",
  "Vimeo",
  "Youku",
  "AgentOps Ledger: Enterprise Agent Flight Recorder",
  "agentops-ledger-demo-46s.mp4",
  "agentops-ledger-video-thumbnail.png",
  "Splunk Agentic Ops Devpost",
  trackerUrl,
];

for (const snippet of videoHostingRequiredSnippets) {
  assert.match(
    videoHosting,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `video-hosting package missing ${snippet}`,
  );
}

const thumbnailRequiredSnippets = [
  "AgentOps Ledger",
  "Enterprise Agent Flight Recorder",
  "Tool calls",
  "Approvals",
  "x402 payments",
  "Splunk-ready",
];

for (const snippet of thumbnailRequiredSnippets) {
  assert.match(
    thumbnailSource,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `thumbnail source missing ${snippet}`,
  );
}

assert.equal(thumbnailPng[0], 0x89, "thumbnail PNG must start with PNG signature byte 0");
assert.equal(thumbnailPng[1], 0x50, "thumbnail PNG must start with PNG signature byte 1");
assert.equal(thumbnailPng[2], 0x4e, "thumbnail PNG must start with PNG signature byte 2");
assert.equal(thumbnailPng[3], 0x47, "thumbnail PNG must start with PNG signature byte 3");
assert.ok(thumbnailStats.size > 20000, "thumbnail PNG should be a real rendered asset");

const linkTargets = [
  ...html.matchAll(/href="([^"]+)"/g),
  ...caseStudy.matchAll(/href="([^"]+)"/g),
].map((match) => match[1]);
for (const target of linkTargets.filter((href) => href.startsWith("http"))) {
  assert.match(target, /^https:\/\//, `external link must use https: ${target}`);
}

console.log("static demo verifier passed");
