/**
 * Seed deterministic Agent Payment Ledger demo runs.
 * Run while the server is up:
 *   npm run seed
 */
const API_KEY = process.env.INSIGHTS_API_KEY || "dev-key";
const URL = process.env.INSIGHTS_URL || "http://localhost:4000/events";

const baseTimestamp = Date.now() - 15 * 60 * 1000;

function ts(offsetMs) {
  return new Date(baseTimestamp + offsetMs).toISOString();
}

async function post(evt) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify(evt),
  });
  if (!res.ok) {
    throw new Error(`seed event failed: ${res.status} ${await res.text()}`);
  }
}

function event(run, offsetMs, event) {
  return {
    timestamp: ts(offsetMs),
    run_id: run.run_id,
    agent: run.agent,
    workflow: run.workflow,
    source: "demo",
    environment: "dev",
    currency: "USDC",
    latency_ms: event.latency_ms ?? 1,
    status: event.status ?? "success",
    retry_count: event.retry_count ?? 0,
    is_retry: event.is_retry ?? false,
    cost: event.cost ?? 0,
    endpoint: event.endpoint ?? `payment-ledger://${event.event_type}`,
    ...event,
  };
}

async function seedRun(run, events) {
  for (const item of events) {
    await post(event(run, item.offsetMs, item));
  }
}

async function main() {
  const success = {
    run_id: "run_demo_vendor_success",
    agent: "vendor-risk-agent",
    workflow: "vendor-risk-review",
  };
  await seedRun(success, [
    {
      offsetMs: 0,
      event_type: "run_start",
      endpoint: "payment-ledger://run/start",
      metadata: { vendor: "Acme Supplies", amount: 42000 },
    },
    {
      offsetMs: 600,
      event_type: "step",
      step_name: "plan_review",
      endpoint: "payment-ledger://step/plan_review",
      metadata: { objective: "review vendor before paid enrichment" },
    },
    {
      offsetMs: 1400,
      event_type: "tool_call",
      step_name: "search_vendor_records",
      tool_name: "mcp.elastic.search",
      endpoint: "elastic://vendors/_search",
      latency_ms: 318,
      metadata: { records_returned: 12 },
    },
    {
      offsetMs: 2600,
      event_type: "approval",
      step_name: "approve_paid_enrichment",
      approval_status: "approved",
      endpoint: "human://approval/vendor-risk",
    },
    {
      offsetMs: 3400,
      event_type: "payment",
      step_name: "paid_enrichment",
      provider: "base-sepolia/exact",
      phase: "settle",
      endpoint: "x402://vendor-enrichment",
      latency_ms: 1904,
      cost: 0.012,
    },
    {
      offsetMs: 5600,
      event_type: "run_finish",
      endpoint: "payment-ledger://run/finish",
      summary: "Vendor cleared after records search, approval, and paid enrichment.",
    },
  ]);

  const retry = {
    run_id: "run_demo_vendor_retry",
    agent: "procurement-agent",
    workflow: "supplier-onboarding",
  };
  await seedRun(retry, [
    {
      offsetMs: 8000,
      event_type: "run_start",
      endpoint: "payment-ledger://run/start",
      metadata: { vendor: "Northwind Parts" },
    },
    {
      offsetMs: 8700,
      event_type: "tool_call",
      step_name: "enrich_supplier_profile",
      tool_name: "mcp.crm.enrich",
      endpoint: "crm://supplier/enrich",
      status: "error",
      error: "upstream timeout",
      latency_ms: 1500,
    },
    {
      offsetMs: 10400,
      event_type: "tool_call",
      step_name: "enrich_supplier_profile",
      tool_name: "mcp.crm.enrich",
      endpoint: "crm://supplier/enrich",
      is_retry: true,
      retry_count: 1,
      latency_ms: 612,
      metadata: { confidence: 0.91 },
    },
    {
      offsetMs: 11800,
      event_type: "payment",
      step_name: "profile_lookup_fee",
      provider: "base-sepolia/exact",
      phase: "settle",
      endpoint: "x402://supplier-profile",
      cost: 0.004,
      latency_ms: 1720,
    },
    {
      offsetMs: 13900,
      event_type: "run_finish",
      endpoint: "payment-ledger://run/finish",
      summary: "Supplier profile completed after one retry.",
    },
  ]);

  const blocked = {
    run_id: "run_demo_vendor_blocked",
    agent: "expense-control-agent",
    workflow: "high-risk-payment-review",
  };
  await seedRun(blocked, [
    {
      offsetMs: 17000,
      event_type: "run_start",
      endpoint: "payment-ledger://run/start",
      metadata: { vendor: "Unverified Logistics", amount: 88000 },
    },
    {
      offsetMs: 17800,
      event_type: "tool_call",
      step_name: "screen_vendor",
      tool_name: "mcp.compliance.screen",
      endpoint: "compliance://vendor/screen",
      latency_ms: 504,
      metadata: { risk_score: 83 },
    },
    {
      offsetMs: 18700,
      event_type: "approval",
      step_name: "approve_external_payment",
      approval_status: "requested",
      endpoint: "human://approval/payment",
    },
    {
      offsetMs: 19800,
      event_type: "approval",
      step_name: "approve_external_payment",
      approval_status: "rejected",
      endpoint: "human://approval/payment",
      metadata: { reason: "vendor risk score above threshold" },
    },
    {
      offsetMs: 20700,
      event_type: "run_finish",
      endpoint: "payment-ledger://run/finish",
      status: "error",
      error: "human approval rejected",
      summary: "Payment blocked by human approval gate.",
    },
  ]);

  console.log("seeded 3 Agent Payment Ledger demo runs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
