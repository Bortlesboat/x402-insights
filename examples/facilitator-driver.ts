/**
 * Live-traffic driver for the @x402-insights/facilitator adapter.
 *
 * Runs the REAL adapter code against a minimal HookableFacilitator shim that
 * implements the same onBefore/onAfter/onFailure hook interface as x402Facilitator.
 * Every event posted here flows through the exact same adapter path that runs in
 * production — just triggered by this driver instead of on-chain verify/settle.
 *
 * Run (after building the adapter):
 *   node dist/facilitator-driver.js
 *
 * Then open http://localhost:4000 and switch mode → "live".
 */
import pkg from "../adapters/facilitator-x402/dist/index.js";
const { attachInsights } = pkg as any;

// ---- Minimal HookableFacilitator shim (matches x402Facilitator hook surface) ----
type Hook = (ctx: any) => Promise<any>;

class FacilitatorShim {
  private hooks: Record<string, Hook[]> = {
    bv: [], av: [], vf: [], bs: [], as: [], sf: [],
  };
  onBeforeVerify(h: Hook)   { this.hooks.bv.push(h); return this; }
  onAfterVerify(h: Hook)    { this.hooks.av.push(h); return this; }
  onVerifyFailure(h: Hook)  { this.hooks.vf.push(h); return this; }
  onBeforeSettle(h: Hook)   { this.hooks.bs.push(h); return this; }
  onAfterSettle(h: Hook)    { this.hooks.as.push(h); return this; }
  onSettleFailure(h: Hook)  { this.hooks.sf.push(h); return this; }

  async runVerify(payload: any, requirements: any, { fail = false, latencyMs = 120 } = {}) {
    const ctx = { paymentPayload: payload, requirements };
    for (const h of this.hooks.bv) await h(ctx);
    await sleep(latencyMs);
    if (fail) {
      for (const h of this.hooks.vf) await h({ ...ctx, error: new Error("signature invalid") });
    } else {
      for (const h of this.hooks.av) await h({ ...ctx, result: { isValid: true } });
    }
  }
  async runSettle(payload: any, requirements: any, { fail = false, latencyMs = 800 } = {}) {
    const ctx = { paymentPayload: payload, requirements };
    for (const h of this.hooks.bs) await h(ctx);
    await sleep(latencyMs);
    if (fail) {
      for (const h of this.hooks.sf) await h({ ...ctx, error: new Error("onchain revert") });
    } else {
      for (const h of this.hooks.as) await h({ ...ctx, result: { success: true, transaction: "0xabc" } });
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const jitter = (base: number, variance = 0.4) => Math.round(base * (1 - variance + Math.random() * variance * 2));

// ---- Scenario: realistic x402 endpoints with mixed costs and error patterns ----
const endpoints = [
  { resource: "https://api.example.com/v1/generate/image",  atomic: "2000",    weight: 3 }, // $0.002 image gen — hot path
  { resource: "https://api.example.com/v1/search",          atomic: "300",     weight: 5 }, // $0.0003 search
  { resource: "https://api.example.com/v1/embed",           atomic: "100",     weight: 4 }, // $0.0001 embed
  { resource: "https://api.example.com/v1/llm/complete",    atomic: "1500",    weight: 4 }, // $0.0015 LLM
  { resource: "https://api.example.com/v1/scrape/url",      atomic: "500",     weight: 2 }, // $0.0005 scrape — flaky
];

function weightedPick() {
  const total = endpoints.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of endpoints) { r -= e.weight; if (r <= 0) return e; }
  return endpoints[0];
}

function buildRequirements(ep: { resource: string; atomic: string }) {
  return {
    scheme: "exact",
    network: "eip155:84532", // Base Sepolia
    maxAmountRequired: ep.atomic,
    resource: ep.resource,
    description: "api request",
    mimeType: "application/json",
    outputSchema: {},
    payTo: "0xFacilitatorAddr",
    maxTimeoutSeconds: 30,
    asset: "0xUSDC",
    extra: {},
  };
}

function buildPayload(nonce: number) {
  return {
    x402Version: 1,
    scheme: "exact",
    network: "eip155:84532",
    payload: { nonce, signer: "0xabc", signature: `0x${nonce.toString(16).padStart(128, "0")}` },
  };
}

// ---- Main ----
async function main() {
  const facilitator = new FacilitatorShim();
  attachInsights(facilitator as any, {
    baseUrl: process.env.INSIGHTS_URL ?? "http://localhost:4000",
    apiKey:  process.env.INSIGHTS_API_KEY ?? "dev-key",
    source:  "facilitator-ts-example",
    environment: "dev",
    agent: "basic-facilitator",
    workflow: "verify-and-settle",
  });

  const TOTAL = Number(process.env.DRIVER_CALLS) || 150;
  console.log(`driving ${TOTAL} verify+settle cycles through the adapter...`);

  for (let i = 0; i < TOTAL; i++) {
    const ep = weightedPick();
    const payload = buildPayload(i);
    const requirements = buildRequirements(ep);
    const scrapeFlaky = ep.resource.includes("/scrape/");
    const verifyFails = Math.random() < (scrapeFlaky ? 0.12 : 0.03);
    const settleFails = !verifyFails && Math.random() < (scrapeFlaky ? 0.18 : 0.04);
    const retryOnSettle = !verifyFails && Math.random() < 0.15;

    await facilitator.runVerify(payload, requirements, {
      fail: verifyFails,
      latencyMs: jitter(120),
    });
    if (verifyFails) continue;

    await facilitator.runSettle(payload, requirements, {
      fail: settleFails,
      latencyMs: jitter(800),
    });
    // If settle failed or we simulate a retry, same payload goes again → retry
    if (retryOnSettle || settleFails) {
      await facilitator.runSettle(payload, requirements, {
        fail: settleFails && Math.random() < 0.5,
        latencyMs: jitter(900),
      });
    }

    if (i % 25 === 0) console.log(`  ... ${i}/${TOTAL}`);
  }

  // Give the last fire-and-forget emits time to reach the backend.
  await sleep(500);
  console.log("done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
