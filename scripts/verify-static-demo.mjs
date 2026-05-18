import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
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
  "startRun",
  "trackToolCall",
  "trackApproval",
  "trackPayment",
  "finishRun",
  "NandaHack",
  "Splunk Agentic Ops",
];

for (const snippet of requiredSnippets) {
  assert.match(html, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `demo page missing ${snippet}`);
}

assert.match(readme, /https:\/\/bortlesboat\.github\.io\/x402-insights\//, "README must link the hosted demo URL");
assert.doesNotMatch(html, /C:[/\\]Users/i, "demo page must not expose local Windows paths");
assert.doesNotMatch(readme, /C:[/\\]Users/i, "README must not expose local Windows paths");

const titleCount = (html.match(/<h1\b/gi) ?? []).length;
assert.equal(titleCount, 1, "demo page should have exactly one h1");

const linkTargets = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
for (const target of linkTargets.filter((href) => href.startsWith("http"))) {
  assert.match(target, /^https:\/\//, `external link must use https: ${target}`);
}

console.log("static demo verifier passed");
