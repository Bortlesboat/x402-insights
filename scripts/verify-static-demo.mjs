import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
const caseStudy = await readFile(new URL("../docs/case-study.html", import.meta.url), "utf8");
const launchPage = await readFile(new URL("../docs/launch.html", import.meta.url), "utf8");
const robots = await readFile(new URL("../docs/robots.txt", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../docs/sitemap.xml", import.meta.url), "utf8");
const llms = await readFile(new URL("../docs/llms.txt", import.meta.url), "utf8");
const judgeIndex = JSON.parse(await readFile(new URL("../docs/hackathon/judge-index.json", import.meta.url), "utf8"));
const graphProbeEvidence = JSON.parse(
  await readFile(new URL("../docs/hackathon/microsoft-graph-metadata-probe.json", import.meta.url), "utf8"),
);
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const submission = await readFile(new URL("../docs/hackathon/agentops-ledger-submission.md", import.meta.url), "utf8");
const splunkSubmission = await readFile(
  new URL("../docs/hackathon/splunk-agentic-ops-submission.md", import.meta.url),
  "utf8",
);
const lablabSubmission = await readFile(
  new URL("../docs/hackathon/techex-lablab-submission.md", import.meta.url),
  "utf8",
);
const agentAcademySubmission = await readFile(
  new URL("../docs/hackathon/microsoft-agent-academy-special-ops.md", import.meta.url),
  "utf8",
);
const lablabSlides = await readFile(new URL("../docs/hackathon/techex-lablab-slides.html", import.meta.url), "utf8");
const microsoftGraphReadme = await readFile(new URL("../adapters/microsoft-graph/README.md", import.meta.url), "utf8");
const videoHosting = await readFile(new URL("../docs/hackathon/video-hosting.md", import.meta.url), "utf8");
const thumbnailSource = await readFile(new URL("../docs/agentops-ledger-video-thumbnail.html", import.meta.url), "utf8");
const thumbnailPng = await readFile(new URL("../docs/agentops-ledger-video-thumbnail.png", import.meta.url));
const thumbnailStats = await stat(new URL("../docs/agentops-ledger-video-thumbnail.png", import.meta.url));
const investigationSearches = await readFile(
  new URL("../adapters/splunk-hec/investigation-pack/searches.json", import.meta.url),
  "utf8",
);

const trackerUrl = "https://github.com/Bortlesboat/x402-insights/issues/10";
const feedbackIssueUrl = "https://github.com/Bortlesboat/x402-insights/issues/21";
const launchPageUrl = "https://bortlesboat.github.io/x402-insights/launch.html";
const llmsUrl = "https://bortlesboat.github.io/x402-insights/llms.txt";
const sitemapUrl = "https://bortlesboat.github.io/x402-insights/sitemap.xml";
const videoHostingUrl = "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/video-hosting.md";
const splunkSubmissionUrl =
  "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-agentic-ops-submission.md";
const investigationPackUrl = "https://github.com/Bortlesboat/x402-insights/tree/main/adapters/splunk-hec/investigation-pack";
const splunkMcpToolMapUrl =
  "https://github.com/Bortlesboat/x402-insights/blob/main/adapters/splunk-hec/investigation-pack/splunk-mcp-tool-map.md";
const hostedVideoUrl = "https://youtu.be/De8c_IgCueU";
const personalPortfolioUrl = "https://bortlesboat.github.io/";
const lablabSubmissionUrl = "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/techex-lablab-submission.md";
const lablabSlidesUrl = "https://bortlesboat.github.io/x402-insights/hackathon/techex-lablab-slides.html";
const agentAcademySubmissionUrl =
  "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/microsoft-agent-academy-special-ops.md";
const microsoftGraphAdapterUrl =
  "https://github.com/Bortlesboat/x402-insights/tree/main/adapters/microsoft-graph";
const microsoftGraphProbeEvidenceUrl =
  "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/microsoft-graph-metadata-probe.json";

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
  "launch.html",
  trackerUrl,
  feedbackIssueUrl,
  launchPageUrl,
  splunkSubmissionUrl,
  videoHostingUrl,
  investigationPackUrl,
  splunkMcpToolMapUrl,
  lablabSubmissionUrl,
  lablabSlidesUrl,
  agentAcademySubmissionUrl,
  microsoftGraphAdapterUrl,
  microsoftGraphProbeEvidenceUrl,
  hostedVideoUrl,
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
  /https:\/\/bortlesboat\.github\.io\/x402-insights\/launch\.html/,
  "README must link the public launch page URL",
);
assert.match(
  readme,
  /https:\/\/github\.com\/Bortlesboat\/x402-insights\/issues\/10/,
  "README must link the public submission/outcome tracker",
);
assert.match(
  readme,
  /https:\/\/github\.com\/Bortlesboat\/x402-insights\/issues\/21/,
  "README must link the public feedback issue",
);
assert.match(readme, /https:\/\/youtu\.be\/De8c_IgCueU/, "README must link the public hosted video");
assert.match(
  readme,
  /docs\/hackathon\/splunk-agentic-ops-submission\.md/,
  "README must link the public Splunk submission packet",
);
assert.doesNotMatch(html, /C:[/\\]Users/i, "demo page must not expose local Windows paths");
assert.doesNotMatch(caseStudy, /C:[/\\]Users/i, "case study page must not expose local Windows paths");
assert.doesNotMatch(launchPage, /C:[/\\]Users/i, "launch page must not expose local Windows paths");
assert.doesNotMatch(robots, /C:[/\\]Users/i, "robots.txt must not expose local Windows paths");
assert.doesNotMatch(sitemap, /C:[/\\]Users/i, "sitemap.xml must not expose local Windows paths");
assert.doesNotMatch(llms, /C:[/\\]Users/i, "llms.txt must not expose local Windows paths");
assert.doesNotMatch(readme, /C:[/\\]Users/i, "README must not expose local Windows paths");
assert.doesNotMatch(submission, /C:[/\\]Users/i, "submission draft must not expose local Windows paths");
assert.doesNotMatch(splunkSubmission, /C:[/\\]Users/i, "Splunk submission packet must not expose local Windows paths");
assert.doesNotMatch(lablabSubmission, /C:[/\\]Users/i, "TechEx/lablab submission packet must not expose local Windows paths");
assert.doesNotMatch(agentAcademySubmission, /C:[/\\]Users/i, "Agent Academy packet must not expose local Windows paths");
assert.doesNotMatch(lablabSlides, /C:[/\\]Users/i, "TechEx/lablab slide page must not expose local Windows paths");
assert.doesNotMatch(microsoftGraphReadme, /C:[/\\]Users/i, "Microsoft Graph adapter README must not expose local Windows paths");
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
  splunkSubmissionUrl,
  splunkMcpToolMapUrl,
  trackerUrl,
  feedbackIssueUrl,
  hostedVideoUrl,
];

for (const snippet of caseStudyRequiredSnippets) {
  assert.match(
    caseStudy,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `case study page missing ${snippet}`,
  );
}

const launchRequiredSnippets = [
  "AgentOps Ledger launch",
  "A flight recorder for enterprise agents",
  "https://youtu.be/De8c_IgCueU",
  "Splunk Agentic Ops",
  "NandaHack submitted",
  "Devpost not submitted yet",
  "splunk_run_query",
  "agentops:run_event",
  "No prize or judging outcome is claimed",
  trackerUrl,
  feedbackIssueUrl,
  "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-agentic-ops-submission.md",
  "https://github.com/Bortlesboat/x402-insights/blob/main/adapters/splunk-hec/investigation-pack/splunk-mcp-tool-map.md",
];

for (const snippet of launchRequiredSnippets) {
  assert.match(
    launchPage,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    `launch page missing ${snippet}`,
  );
}

assert.doesNotMatch(launchPage, /winner|finalist|accepted|award-winning/i, "launch page must not claim outcomes");

const discoveryRequiredSnippets = [
  "AgentOps Ledger",
  "enterprise-agent flight recorder",
  "https://bortlesboat.github.io/x402-insights/launch.html",
  "https://bortlesboat.github.io/x402-insights/case-study.html",
  "https://github.com/Bortlesboat/x402-insights/blob/main/docs/hackathon/splunk-agentic-ops-submission.md",
  "https://github.com/Bortlesboat/x402-insights/blob/main/adapters/splunk-hec/investigation-pack/splunk-mcp-tool-map.md",
  "https://youtu.be/De8c_IgCueU",
  feedbackIssueUrl,
  `Personal portfolio: ${personalPortfolioUrl}`,
  lablabSubmissionUrl,
  lablabSlidesUrl,
  agentAcademySubmissionUrl,
  microsoftGraphAdapterUrl,
  microsoftGraphProbeEvidenceUrl,
  "No prize or judging outcome is claimed",
];

for (const snippet of discoveryRequiredSnippets) {
  assert.match(llms, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `llms.txt missing ${snippet}`);
}

for (const bot of ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "Bingbot"]) {
  assert.match(robots, new RegExp(`User-agent: ${bot}[\\s\\S]*?Allow: /`, "i"), `robots.txt must allow ${bot}`);
}
assert.match(robots, new RegExp(`Sitemap: ${sitemapUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), "robots.txt must link sitemap");

for (const url of [
  "https://bortlesboat.github.io/x402-insights/",
  launchPageUrl,
  "https://bortlesboat.github.io/x402-insights/case-study.html",
  llmsUrl,
]) {
  assert.match(sitemap, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `sitemap missing ${url}`);
}

assert.equal(judgeIndex.project.name, "AgentOps Ledger", "judge index should name AgentOps Ledger");
assert.equal(judgeIndex.project.status.goalComplete, false, "judge index must keep goalComplete false");
assert.equal(judgeIndex.project.status.splunkDevpostSubmitted, false, "judge index must not claim Splunk Devpost submission");
assert.equal(judgeIndex.project.status.lablabTechexSubmitted, false, "judge index must not claim lablab/TechEx submission");
assert.equal(judgeIndex.project.status.agentAcademySubmitted, false, "judge index must not claim Microsoft Agent Academy submission");
assert.equal(judgeIndex.project.status.socialLaunchPosted, false, "judge index must not claim social posting");
assert.equal(judgeIndex.project.status.prizeOutcomeClaimed, false, "judge index must not claim an outcome");
for (const url of [
  launchPageUrl,
  hostedVideoUrl,
  trackerUrl,
  feedbackIssueUrl,
  splunkSubmissionUrl,
  splunkMcpToolMapUrl,
  personalPortfolioUrl,
  lablabSubmissionUrl,
  lablabSlidesUrl,
  agentAcademySubmissionUrl,
  microsoftGraphAdapterUrl,
  microsoftGraphProbeEvidenceUrl,
]) {
  assert.ok(Object.values(judgeIndex.links).includes(url), `judge index links missing ${url}`);
}
assert.match(launchPage, /llms\.txt/, "launch page must link llms.txt");
assert.match(launchPage, /judge-index\.json/, "launch page must link the machine-readable judge index");

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
assert.match(submission, /https:\/\/youtu\.be\/De8c_IgCueU/, "submission draft must link the public hosted video");

const splunkSubmissionRequiredSnippets = [
  "Splunk Agentic Ops Submission Packet",
  "Platform & Developer Experience",
  "https://splunk.devpost.com/",
  hostedVideoUrl,
  "agentops:run_event",
  "splunk_run_query",
  splunkMcpToolMapUrl,
  investigationPackUrl,
  "Submissions open soon",
  "No MCP execution proof is claimed",
  trackerUrl,
];

for (const snippet of splunkSubmissionRequiredSnippets) {
  assert.match(
    splunkSubmission,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    `Splunk submission packet missing ${snippet}`,
  );
}

const lablabSubmissionRequiredSnippets = [
  "TechEx/lablab Transforming Enterprise Through AI Submission Packet",
  "https://lablab.ai/ai-hackathons/techex-intelligent-enterprise-solutions-hackathon",
  "May 11-19, 2026",
  "$10,000 prize pool",
  "Track 1: Agent Security & AI Governance",
  "B2B FinOps & Compliance",
  "Project Title",
  "Short Description",
  "Long Description",
  "Technology & Category Tags",
  "Cover Image",
  "Video Presentation",
  "Slide Presentation",
  "Public GitHub Repository",
  "Application URL",
  hostedVideoUrl,
  lablabSlidesUrl,
  "No lablab submission proof is claimed yet",
  "No Gemini, Veea Lobster Trap, or lablab platform execution proof is claimed",
  "No prize or judging outcome is claimed",
];

for (const snippet of lablabSubmissionRequiredSnippets) {
  assert.match(
    lablabSubmission,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    `TechEx/lablab submission packet missing ${snippet}`,
  );
}

const agentAcademySubmissionRequiredSnippets = [
  "Microsoft Agent Academy Hackathon",
  "Special Ops",
  "May 12",
  "June 2, 2026",
  "Microsoft Graph API",
  "https://graph.microsoft.com/v1.0/$metadata",
  "agent-academy-special-ops-agent",
  "microsoft-graph-metadata-probe.json",
  "Not submitted",
  "No badge, winner, finalist, or prize outcome is claimed",
  microsoftGraphAdapterUrl,
];

for (const snippet of agentAcademySubmissionRequiredSnippets) {
  assert.match(
    agentAcademySubmission,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    `Agent Academy packet missing ${snippet}`,
  );
}

const microsoftGraphReadmeRequiredSnippets = [
  "Microsoft Graph API",
  "https://graph.microsoft.com/v1.0/$metadata",
  "run_microsoft_graph_metadata_probe",
  "microsoft.graph.metadata",
  "no tenant, user, or payment data",
  "node adapters/microsoft-graph/graph-metadata-probe.mjs --json",
];

for (const snippet of microsoftGraphReadmeRequiredSnippets) {
  assert.match(
    microsoftGraphReadme,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    `Microsoft Graph adapter README missing ${snippet}`,
  );
}

assert.equal(graphProbeEvidence.run_id, "run_microsoft_graph_metadata_probe", "Graph probe evidence must name the probe run");
assert.equal(graphProbeEvidence.status, "success", "Graph probe evidence must be successful");
const graphProbeToolEvent = graphProbeEvidence.events.find((event) => event.event_type === "tool_call");
assert.equal(graphProbeToolEvent.tool_name, "microsoft.graph.metadata", "Graph probe evidence must include the metadata tool call");
assert.equal(
  graphProbeToolEvent.endpoint,
  "https://graph.microsoft.com/v1.0/$metadata",
  "Graph probe evidence must use the public Microsoft Graph metadata endpoint",
);
assert.ok(graphProbeToolEvent.metadata.entity_types > 0, "Graph probe evidence must include entity type count");
assert.ok(graphProbeToolEvent.metadata.entity_sets > 0, "Graph probe evidence must include entity set count");
assert.doesNotMatch(JSON.stringify(graphProbeEvidence), /authorization|bearer|access_token|refresh_token|client_secret/i);

const lablabSlidesRequiredSnippets = [
  "AgentOps Ledger",
  "TechEx / lablab",
  "Enterprise-agent audit trail",
  "x402 payment telemetry",
  "Splunk-ready evidence",
  "No lablab submission proof is claimed yet",
  hostedVideoUrl,
  lablabSubmissionUrl,
];

for (const snippet of lablabSlidesRequiredSnippets) {
  assert.match(
    lablabSlides,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    `TechEx/lablab slide page missing ${snippet}`,
  );
}

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
  hostedVideoUrl,
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
  ...launchPage.matchAll(/href="([^"]+)"/g),
].map((match) => match[1]);
for (const target of linkTargets.filter((href) => href.startsWith("http"))) {
  assert.match(target, /^https:\/\//, `external link must use https: ${target}`);
}

console.log("static demo verifier passed");
