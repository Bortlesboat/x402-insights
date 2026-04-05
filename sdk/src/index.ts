/**
 * x402-insights SDK — wrap any x402 call, log what it cost.
 */

export interface TrackOptions<T> {
  agent: string;
  workflow: string;
  endpoint: string;
  fn: () => Promise<T>;
  /** Manually provided cost for v1. Automatic capture comes later. */
  cost?: number;
  currency?: string;
  provider?: string;
  request_id?: string;
  environment?: "dev" | "prod" | string;
  /** Where the instrumentation lives: "facilitator", "lightning-pr", "sdk", etc. */
  source?: string;
  /** Retry metadata — set both when this call is a retry. */
  is_retry?: boolean;
  retry_count?: number;
  /** If your fn returns { result, cost }, pull cost from it. */
  extractCost?: (result: T) => number | undefined;
  /** If your fn exposes an HTTP status code. */
  extractStatusCode?: (result: T) => number | undefined;
}

export interface TrackEvent {
  timestamp: string;
  agent: string;
  workflow: string;
  endpoint: string;
  provider?: string;
  request_id?: string;
  status_code?: number;
  retry_count: number;
  is_retry: boolean;
  environment: string;
  source: string;
  cost: number;
  currency: string;
  latency_ms: number;
  status: "success" | "error";
  error?: string;
}

export interface InsightsClientConfig {
  /** Backend ingestion URL, e.g. http://localhost:4000 */
  baseUrl: string;
  apiKey: string;
  /** Default source tag for all events from this process. */
  defaultSource?: string;
  /** Default environment. */
  defaultEnvironment?: string;
}

let globalConfig: InsightsClientConfig | null = null;

export function configure(config: InsightsClientConfig): void {
  globalConfig = config;
}

async function sendEvent(event: TrackEvent): Promise<void> {
  if (!globalConfig) {
    console.warn("[x402-insights] not configured, dropping event");
    return;
  }
  try {
    await fetch(`${globalConfig.baseUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": globalConfig.apiKey,
      },
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.warn("[x402-insights] failed to send event:", err);
  }
}

export async function trackX402<T>(opts: TrackOptions<T>): Promise<T> {
  const started = Date.now();
  let status: "success" | "error" = "success";
  let errorMsg: string | undefined;
  let result: T | undefined;
  let statusCode: number | undefined;

  try {
    result = await opts.fn();
    return result;
  } catch (err) {
    status = "error";
    errorMsg = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const latency_ms = Date.now() - started;
    let cost = opts.cost ?? 0;
    if (result !== undefined && opts.extractCost) {
      const extracted = opts.extractCost(result);
      if (typeof extracted === "number") cost = extracted;
    }
    if (result !== undefined && opts.extractStatusCode) {
      statusCode = opts.extractStatusCode(result);
    }
    const event: TrackEvent = {
      timestamp: new Date().toISOString(),
      agent: opts.agent,
      workflow: opts.workflow,
      endpoint: opts.endpoint,
      provider: opts.provider,
      request_id: opts.request_id,
      status_code: statusCode,
      retry_count: opts.retry_count ?? 0,
      is_retry: opts.is_retry ?? false,
      environment: opts.environment ?? globalConfig?.defaultEnvironment ?? "dev",
      source: opts.source ?? globalConfig?.defaultSource ?? "sdk",
      cost,
      currency: opts.currency ?? "USDC",
      latency_ms,
      status,
      error: errorMsg,
    };
    void sendEvent(event);
  }
}
