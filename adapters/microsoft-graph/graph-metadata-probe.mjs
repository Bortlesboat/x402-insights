import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const GRAPH_METADATA_URL = "https://graph.microsoft.com/v1.0/$metadata";

function countMatches(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

export function summarizeGraphMetadataXml(xml) {
  return {
    entityTypes: countMatches(xml, /<EntityType\b/g),
    entitySets: countMatches(xml, /<EntitySet\b/g),
    actions: countMatches(xml, /<Action\b/g),
    functions: countMatches(xml, /<Function\b/g),
    hasEntityContainer: /<EntityContainer\b/.test(xml),
  };
}

export function buildGraphMetadataRun({ checkedAt, durationMs, summary, status = "success" }) {
  const base = {
    run_id: "run_microsoft_graph_metadata_probe",
    agent: "agent-academy-special-ops-agent",
    workflow: "microsoft-graph-compliance-packet",
    status,
    started_at: checkedAt,
    finished_at: checkedAt,
  };

  return {
    ...base,
    events: [
      {
        timestamp: checkedAt,
        event_type: "run_started",
        status: "running",
        agent: base.agent,
        workflow: base.workflow,
        metadata: {
          route: "Microsoft Agent Academy Special Ops",
        },
      },
      {
        timestamp: checkedAt,
        event_type: "tool_call",
        step_name: "inspect_graph_metadata",
        tool_name: "microsoft.graph.metadata",
        endpoint: GRAPH_METADATA_URL,
        status,
        duration_ms: durationMs,
        risk_flags: ["external_system", "read_only_metadata", "no_user_data"],
        metadata: {
          microsoft_service: "Microsoft Graph API",
          entity_types: summary.entityTypes,
          entity_sets: summary.entitySets,
          actions: summary.actions,
          functions: summary.functions,
          has_entity_container: summary.hasEntityContainer,
        },
      },
      {
        timestamp: checkedAt,
        event_type: "approval",
        step_name: "tenant_data_access",
        approval_status: "not_required",
        status: "skipped",
        metadata: {
          reason: "Public metadata endpoint; no tenant, user, or payment data accessed.",
        },
      },
      {
        timestamp: checkedAt,
        event_type: "run_finished",
        status,
        summary: "Microsoft Graph metadata inspected and converted into Agent Payment Ledger run evidence.",
      },
    ],
  };
}

export async function probeGraphMetadata({ fetchImpl = fetch, now = () => new Date() } = {}) {
  const start = performance.now();
  const response = await fetchImpl(GRAPH_METADATA_URL);
  const xml = await response.text();
  const durationMs = Math.round(performance.now() - start);
  const summary = summarizeGraphMetadataXml(xml);

  return buildGraphMetadataRun({
    checkedAt: now().toISOString(),
    durationMs,
    summary,
    status: response.ok && summary.hasEntityContainer ? "success" : "error",
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const outIndex = process.argv.indexOf("--out");
  const outputPath = outIndex >= 0 ? process.argv[outIndex + 1] : "";
  const run = await probeGraphMetadata();
  const json = JSON.stringify(run, null, 2);

  if (outputPath) {
    await writeFile(outputPath, `${json}\n`, "utf8");
  }

  if (args.has("--json") || !outputPath) {
    console.log(json);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
