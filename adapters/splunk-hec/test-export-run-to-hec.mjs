import assert from "node:assert/strict";
import http from "node:http";

import { exportRunToSplunk } from "./export-run-to-hec.mjs";

async function startJsonServer(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  return {
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const runExport = {
  run_id: "run_vendor_blocked",
  agent: "vendor-risk-agent",
  workflow: "vendor-risk-review",
  status: "blocked",
  started_at: "2026-05-18T01:00:00.000Z",
  finished_at: "2026-05-18T01:00:05.000Z",
  events: [
    {
      timestamp: "2026-05-18T01:00:00.000Z",
      event_type: "run_started",
      status: "running",
    },
    {
      timestamp: "2026-05-18T01:00:02.000Z",
      event_type: "tool_call",
      step_name: "search_vendor_records",
      tool_name: "mcp.elastic.search",
      endpoint: "elastic://vendors/_search",
      status: "success",
      duration_ms: 214,
    },
    {
      timestamp: "2026-05-18T01:00:04.000Z",
      event_type: "approval",
      step_name: "approve_paid_enrichment",
      approval_status: "rejected",
      status: "blocked",
    },
  ],
};

const agentopsServer = await startJsonServer((request, response) => {
  if (request.method === "GET" && request.url === "/api/runs/run_vendor_blocked/export") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(runExport));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ error: "not found" }));
});

const hecRequests = [];
const splunkServer = await startJsonServer(async (request, response) => {
  hecRequests.push({
    method: request.method,
    url: request.url,
    authorization: request.headers.authorization,
    body: await readRequestBody(request),
  });

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ text: "Success", code: 0 }));
});

try {
  const result = await exportRunToSplunk({
    agentopsBaseUrl: agentopsServer.url,
    runId: "run_vendor_blocked",
    splunkHecUrl: splunkServer.url,
    splunkToken: "test-token",
    index: "agentops_test",
  });

  assert.deepEqual(result, {
    runId: "run_vendor_blocked",
    sent: 3,
    splunk: { text: "Success", code: 0 },
  });

  assert.equal(hecRequests.length, 1);
  assert.equal(hecRequests[0].method, "POST");
  assert.equal(hecRequests[0].url, "/services/collector/event");
  assert.equal(hecRequests[0].authorization, "Splunk test-token");

  const hecEvents = hecRequests[0].body
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  assert.equal(hecEvents.length, 3);
  assert.deepEqual(
    hecEvents.map((event) => event.event.event_type),
    ["run_started", "tool_call", "approval"],
  );
  assert.equal(hecEvents[1].index, "agentops_test");
  assert.equal(hecEvents[1].source, "agentops-ledger");
  assert.equal(hecEvents[1].sourcetype, "agentops:run_event");
  assert.equal(hecEvents[1].event.run_id, "run_vendor_blocked");
  assert.equal(hecEvents[1].event.run_status, "blocked");
  assert.equal(hecEvents[1].event.tool_name, "mcp.elastic.search");
  assert.equal(hecEvents[2].event.approval_status, "rejected");
  assert.equal(hecEvents[0].time, 1779066000);

  console.log("splunk hec export test passed");
} finally {
  await Promise.all([agentopsServer.close(), splunkServer.close()]);
}
