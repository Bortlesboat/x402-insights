import assert from "node:assert/strict";

import {
  GRAPH_METADATA_URL,
  buildGraphMetadataRun,
  summarizeGraphMetadataXml,
} from "./graph-metadata-probe.mjs";

const sampleMetadata = `
<edmx:Edmx>
  <edmx:DataServices>
    <Schema Namespace="microsoft.graph">
      <EntityType Name="user" />
      <EntityType Name="group" />
      <Action Name="sendMail" />
      <Function Name="delta" />
      <EntityContainer Name="GraphService">
        <EntitySet Name="users" EntityType="microsoft.graph.user" />
        <EntitySet Name="groups" EntityType="microsoft.graph.group" />
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;

const summary = summarizeGraphMetadataXml(sampleMetadata);

assert.deepEqual(summary, {
  entityTypes: 2,
  entitySets: 2,
  actions: 1,
  functions: 1,
  hasEntityContainer: true,
});

const run = buildGraphMetadataRun({
  checkedAt: "2026-05-18T12:40:00.000Z",
  durationMs: 321,
  summary,
});

assert.equal(GRAPH_METADATA_URL, "https://graph.microsoft.com/v1.0/$metadata");
assert.equal(run.run_id, "run_microsoft_graph_metadata_probe");
assert.equal(run.agent, "agent-academy-special-ops-agent");
assert.equal(run.workflow, "microsoft-graph-compliance-packet");
assert.equal(run.status, "success");
assert.equal(run.events.length, 4);

const toolEvent = run.events.find((event) => event.event_type === "tool_call");
assert.equal(toolEvent.tool_name, "microsoft.graph.metadata");
assert.equal(toolEvent.endpoint, GRAPH_METADATA_URL);
assert.equal(toolEvent.status, "success");
assert.equal(toolEvent.duration_ms, 321);
assert.equal(toolEvent.metadata.microsoft_service, "Microsoft Graph API");
assert.equal(toolEvent.metadata.entity_sets, 2);
assert.deepEqual(toolEvent.risk_flags, ["external_system", "read_only_metadata", "no_user_data"]);

const approvalEvent = run.events.find((event) => event.event_type === "approval");
assert.equal(approvalEvent.approval_status, "not_required");
assert.equal(approvalEvent.metadata.reason, "Public metadata endpoint; no tenant, user, or payment data accessed.");

const serialized = JSON.stringify(run);
assert.doesNotMatch(serialized, /authorization|bearer|access_token|refresh_token|client_secret/i);

console.log("microsoft graph metadata probe test passed");
