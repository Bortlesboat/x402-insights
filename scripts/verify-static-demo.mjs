import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
const caseStudy = await readFile(new URL("../docs/case-study.html", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

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
  "Indexed Splunk proof",
  "startRun",
  "trackToolCall",
  "trackApproval",
  "trackPayment",
  "finishRun",
  "NandaHack",
  "Splunk Agentic Ops",
  "case-study.html",
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
assert.doesNotMatch(html, /C:[/\\]Users/i, "demo page must not expose local Windows paths");
assert.doesNotMatch(caseStudy, /C:[/\\]Users/i, "case study page must not expose local Windows paths");
assert.doesNotMatch(readme, /C:[/\\]Users/i, "README must not expose local Windows paths");

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
  "https://github.com/Bortlesboat/x402-insights",
  "https://bortlesboat.github.io/x402-insights/",
  "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-hec-proof.md",
];

for (const snippet of caseStudyRequiredSnippets) {
  assert.match(
    caseStudy,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `case study page missing ${snippet}`,
  );
}

const linkTargets = [
  ...html.matchAll(/href="([^"]+)"/g),
  ...caseStudy.matchAll(/href="([^"]+)"/g),
].map((match) => match[1]);
for (const target of linkTargets.filter((href) => href.startsWith("http"))) {
  assert.match(target, /^https:\/\//, `external link must use https: ${target}`);
}

console.log("static demo verifier passed");
