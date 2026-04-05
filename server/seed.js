/**
 * Seed demo data so the dashboard has something to render.
 * Run: node seed.js
 */
const API_KEY = process.env.INSIGHTS_API_KEY || "dev-key";
const URL = process.env.INSIGHTS_URL || "http://localhost:4000/events";

const agents = ["research-agent", "image-agent", "summarizer"];
const workflows = ["candidate-analysis", "daily-brief", "thread-summary"];
const endpoints = [
  { name: "image-gen", cost: 0.0021 },
  { name: "search", cost: 0.0003 },
  { name: "embed", cost: 0.0001 },
  { name: "llm-completion", cost: 0.0015 },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function post(evt) {
  await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify(evt),
  });
}

(async () => {
  const now = Date.now();
  for (let i = 0; i < 200; i++) {
    const ep = pick(endpoints);
    const jitter = 0.7 + Math.random() * 0.6;
    const isErr = Math.random() < 0.04;
    const ts = new Date(now - Math.random() * 24 * 3600 * 1000).toISOString();
    const isRetry = Math.random() < 0.22;
    await post({
      timestamp: ts,
      agent: pick(agents),
      workflow: pick(workflows),
      endpoint: ep.name,
      provider: "demo-provider",
      source: "demo",
      environment: "dev",
      is_retry: isRetry,
      retry_count: isRetry ? 1 + Math.floor(Math.random() * 2) : 0,
      status_code: isErr ? 402 : 200,
      cost: +(ep.cost * jitter).toFixed(6),
      currency: "USDC",
      latency_ms: Math.round(200 + Math.random() * 1500),
      status: isErr ? "error" : "success",
      error: isErr ? "upstream 402 retry exhausted" : undefined,
    });
  }
  console.log("seeded 200 events");
})();
