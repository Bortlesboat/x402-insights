import { pathToFileURL } from "node:url";

const DEFAULT_SOURCE = "agentops-ledger";
const DEFAULT_SOURCETYPE = "agentops:run_event";

function requireValue(name, value) {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null),
  );
}

function normalizeHecUrl(value) {
  const trimmed = requireValue("splunkHecUrl", value).replace(/\/+$/, "");

  if (trimmed.endsWith("/services/collector/event")) {
    return trimmed;
  }

  if (trimmed.endsWith("/services/collector")) {
    return `${trimmed}/event`;
  }

  return `${trimmed}/services/collector/event`;
}

function toEpochSeconds(value) {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return Math.floor(Date.now() / 1000);
  }

  return Math.floor(parsed / 1000);
}

async function readJsonResponse(response) {
  const body = await response.text();

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    return { text: body };
  }
}

async function fetchRunExport(agentopsBaseUrl, runId) {
  const baseUrl = requireValue("agentopsBaseUrl", agentopsBaseUrl).replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/api/runs/${encodeURIComponent(runId)}/export`);

  if (!response.ok) {
    throw new Error(`AgentOps export failed with HTTP ${response.status}`);
  }

  return response.json();
}

export function buildHecEvents(runExport, options = {}) {
  const events = Array.isArray(runExport.events) ? runExport.events : [];
  const runId = runExport.run_id ?? options.runId;

  return events.map((event) => ({
    time: toEpochSeconds(event.timestamp ?? runExport.started_at ?? new Date().toISOString()),
    host: options.host,
    index: options.index,
    source: options.source ?? DEFAULT_SOURCE,
    sourcetype: options.sourcetype ?? DEFAULT_SOURCETYPE,
    event: compactObject({
      run_id: runId,
      agent: event.agent ?? runExport.agent,
      workflow: event.workflow ?? runExport.workflow,
      source: event.source ?? runExport.source,
      environment: event.environment ?? runExport.environment,
      run_status: runExport.status,
      started_at: runExport.started_at,
      finished_at: runExport.finished_at,
      ...event,
    }),
  }));
}

export async function exportRunToSplunk(options) {
  const runId = requireValue("runId", options.runId);
  const splunkToken = requireValue("splunkToken", options.splunkToken);
  const runExport = await fetchRunExport(options.agentopsBaseUrl, runId);
  const hecEvents = buildHecEvents(runExport, options);

  const response = await fetch(normalizeHecUrl(options.splunkHecUrl), {
    method: "POST",
    headers: {
      Authorization: `Splunk ${splunkToken}`,
      "Content-Type": "application/json",
    },
    body: hecEvents.map((event) => JSON.stringify(compactObject(event))).join("\n"),
  });

  const splunk = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(`Splunk HEC export failed with HTTP ${response.status}: ${JSON.stringify(splunk)}`);
  }

  return {
    runId: runExport.run_id ?? runId,
    sent: hecEvents.length,
    splunk,
  };
}

async function main() {
  const result = await exportRunToSplunk({
    agentopsBaseUrl: process.env.AGENTOPS_BASE_URL ?? "http://localhost:4000",
    runId: process.env.AGENTOPS_RUN_ID,
    splunkHecUrl: process.env.SPLUNK_HEC_URL,
    splunkToken: process.env.SPLUNK_HEC_TOKEN,
    index: process.env.SPLUNK_INDEX,
    source: process.env.SPLUNK_SOURCE,
    sourcetype: process.env.SPLUNK_SOURCETYPE,
    host: process.env.SPLUNK_HOST,
  });

  console.log(`Exported ${result.sent} Agent Payment Ledger events for ${result.runId} to Splunk HEC`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
