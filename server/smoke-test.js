const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PORT = "4199";
const API_KEY = "test-key";
const DB_PATH = path.join(__dirname, "test-agentops-ledger.db");
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function cleanupDb() {
  for (const suffix of ["", "-shm", "-wal"]) {
    const file = DB_PATH + suffix;
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
        break;
      } catch (err) {
        if (err.code !== "EBUSY" || attempt === 9) throw err;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }
}

function startServer() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT,
      INSIGHTS_API_KEY: API_KEY,
      INSIGHTS_DB: DB_PATH,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  return { child, getOutput: () => output };
}

async function waitForServer() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/overview`);
      if (res.ok) return;
    } catch {
      // server is still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("server did not start");
}

async function stopServer(child) {
  if (child.exitCode !== null || child.killed) return;
  await new Promise((resolve) => {
    child.once("close", resolve);
    child.kill();
  });
}

async function postEvent(event) {
  const res = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(event),
  });
  if (res.status !== 200) {
    throw new Error(`POST /events failed: ${res.status} ${await res.text()}`);
  }
}

async function getJson(pathname) {
  const res = await fetch(`${BASE_URL}${pathname}`);
  if (res.status !== 200) {
    throw new Error(`GET ${pathname} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  await cleanupDb();
  const server = startServer();

  try {
    await waitForServer();

    const runId = "run_smoke_vendor_success";
    const base = {
      run_id: runId,
      agent: "vendor-risk-agent",
      workflow: "vendor-risk-review",
      environment: "test",
      source: "smoke-test",
      currency: "USDC",
      latency_ms: 1,
      status: "success",
      timestamp: new Date().toISOString(),
    };

    await postEvent({
      ...base,
      event_type: "run_start",
      endpoint: "payment-ledger://run/start",
      cost: 0,
      metadata: { vendor: "Acme Supplies" },
    });
    await postEvent({
      ...base,
      event_type: "tool_call",
      step_name: "search_vendor_records",
      tool_name: "mcp.elastic.search",
      endpoint: "elastic://vendors/_search",
      cost: 0,
      metadata: { records_returned: 12 },
    });
    await postEvent({
      ...base,
      event_type: "approval",
      step_name: "approve_paid_enrichment",
      approval_status: "approved",
      endpoint: "human://approval/vendor-risk",
      cost: 0,
    });
    await postEvent({
      ...base,
      event_type: "payment",
      step_name: "paid_enrichment",
      provider: "base-sepolia/exact",
      endpoint: "x402://vendor-enrichment",
      phase: "settle",
      cost: 0.012,
    });
    await postEvent({
      ...base,
      event_type: "run_finish",
      endpoint: "payment-ledger://run/finish",
      cost: 0,
      summary: "Vendor risk review completed after human approval.",
    });

    const runs = await getJson("/api/runs");
    const run = runs.find((row) => row.run_id === runId);
    assert.ok(run, "expected smoke run in /api/runs");
    assert.equal(run.status, "success");
    assert.equal(run.event_count, 5);
    assert.equal(run.approval_count, 1);
    assert.equal(Number(run.total_cost).toFixed(3), "0.012");

    const detail = await getJson(`/api/runs/${runId}`);
    assert.equal(detail.run.run_id, runId);
    assert.equal(detail.events.length, 5);
    assert.equal(detail.summary.approval_count, 1);

    const exported = await getJson(`/api/runs/${runId}/export`);
    assert.equal(exported.run.run_id, runId);
    assert.equal(exported.events.length, 5);

    const seed = spawnSync(process.execPath, ["seed.js"], {
      cwd: __dirname,
      env: {
        ...process.env,
        INSIGHTS_URL: `${BASE_URL}/events`,
        INSIGHTS_API_KEY: API_KEY,
      },
      encoding: "utf8",
    });
    assert.equal(seed.status, 0, seed.stderr || seed.stdout);

    const seededRuns = await getJson("/api/runs?limit=20");
    const seededRunIds = seededRuns.map((row) => row.run_id);
    assert.ok(seededRunIds.includes("run_demo_vendor_success"));
    assert.ok(seededRunIds.includes("run_demo_vendor_retry"));
    assert.ok(seededRunIds.includes("run_demo_vendor_blocked"));

    console.log("server smoke test passed");
  } finally {
    await stopServer(server.child);
    await cleanupDb();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
