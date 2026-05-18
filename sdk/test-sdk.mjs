import assert from "node:assert/strict";
import http from "node:http";

const events = [];

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/events") {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;
  events.push(JSON.parse(body));
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
});

function listen() {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address()));
  });
}

async function waitForEvents(count) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if (events.length >= count) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`expected ${count} events, got ${events.length}`);
}

const address = await listen();
const sdk = await import("./dist/index.js");

try {
  sdk.configure({
    baseUrl: `http://127.0.0.1:${address.port}`,
    apiKey: "test-key",
    defaultEnvironment: "test",
    defaultSource: "sdk-smoke",
  });

  const runId = await sdk.startRun({
    agent: "test-agent",
    workflow: "test-flow",
    metadata: { fixture: true },
  });

  await sdk.trackStep({
    run_id: runId,
    agent: "test-agent",
    workflow: "test-flow",
    step_name: "plan",
    metadata: { notes: "choose tool" },
  });

  await sdk.trackToolCall({
    run_id: runId,
    agent: "test-agent",
    workflow: "test-flow",
    step_name: "search",
    tool_name: "mock.search",
    endpoint: "mock://search",
    fn: async () => ({ ok: true }),
  });

  await sdk.trackApproval({
    run_id: runId,
    agent: "test-agent",
    workflow: "test-flow",
    step_name: "approve",
    approval_status: "approved",
  });

  await sdk.trackPayment({
    run_id: runId,
    agent: "test-agent",
    workflow: "test-flow",
    endpoint: "x402://demo",
    provider: "base-sepolia/exact",
    cost: 0.01,
    currency: "USDC",
    phase: "settle",
  });

  await sdk.finishRun({
    run_id: runId,
    agent: "test-agent",
    workflow: "test-flow",
    status: "success",
    summary: "test flow completed",
  });

  await waitForEvents(6);

  assert.match(runId, /^run_/);
  assert.deepEqual(
    events.map((event) => event.event_type),
    ["run_start", "step", "tool_call", "approval", "payment", "run_finish"],
  );
  assert.equal(events[2].tool_name, "mock.search");
  assert.equal(events[3].approval_status, "approved");
  assert.equal(events[4].cost, 0.01);
  assert.equal(events[5].status, "success");

  console.log("sdk smoke test passed");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
