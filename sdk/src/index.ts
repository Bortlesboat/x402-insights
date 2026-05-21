/**
 * x402-insights SDK - wrap any x402 call, log what it cost.
 */

export interface TrackOptions<T> {
  run_id?: string;
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
  /** Retry metadata - set both when this call is a retry. */
  is_retry?: boolean;
  retry_count?: number;
  /** If your fn returns { result, cost }, pull cost from it. */
  extractCost?: (result: T) => number | undefined;
  /** If your fn exposes an HTTP status code. */
  extractStatusCode?: (result: T) => number | undefined;
}

export type AgentOpsEventType =
  | "run_start"
  | "step"
  | "tool_call"
  | "approval"
  | "payment"
  | "policy"
  | "error"
  | "run_finish";

export interface TrackEvent {
  timestamp: string;
  run_id?: string;
  event_type?: AgentOpsEventType;
  agent: string;
  workflow: string;
  endpoint: string;
  step_name?: string;
  tool_name?: string;
  provider?: string;
  request_id?: string;
  status_code?: number;
  phase?: string;
  approval_status?: "requested" | "approved" | "rejected" | "bypassed";
  metadata?: Record<string, unknown>;
  retry_count: number;
  is_retry: boolean;
  environment: string;
  source: string;
  cost: number;
  currency: string;
  latency_ms: number;
  status: "success" | "error";
  summary?: string;
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

function makeRunId(prefix = "run"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
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

function baseEvent(input: {
  run_id?: string;
  event_type: AgentOpsEventType;
  agent: string;
  workflow: string;
  endpoint?: string;
  step_name?: string;
  tool_name?: string;
  provider?: string;
  phase?: string;
  approval_status?: "requested" | "approved" | "rejected" | "bypassed";
  cost?: number;
  currency?: string;
  latency_ms?: number;
  status?: "success" | "error";
  error?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}): TrackEvent {
  return {
    timestamp: new Date().toISOString(),
    run_id: input.run_id,
    event_type: input.event_type,
    agent: input.agent,
    workflow: input.workflow,
    endpoint: input.endpoint ?? `payment-ledger://${input.event_type}`,
    step_name: input.step_name,
    tool_name: input.tool_name,
    provider: input.provider,
    phase: input.phase,
    approval_status: input.approval_status,
    retry_count: 0,
    is_retry: false,
    environment: globalConfig?.defaultEnvironment ?? "dev",
    source: globalConfig?.defaultSource ?? "sdk",
    cost: input.cost ?? 0,
    currency: input.currency ?? "USD",
    latency_ms: input.latency_ms ?? 0,
    status: input.status ?? "success",
    summary: input.summary,
    error: input.error,
    metadata: input.metadata,
  };
}

export async function startRun(input: {
  run_id?: string;
  agent: string;
  workflow: string;
  environment?: string;
  source?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const run_id = input.run_id ?? makeRunId();
  await sendEvent({
    ...baseEvent({
      run_id,
      event_type: "run_start",
      agent: input.agent,
      workflow: input.workflow,
      endpoint: "payment-ledger://run/start",
      summary: input.summary,
      metadata: input.metadata,
    }),
    environment: input.environment ?? globalConfig?.defaultEnvironment ?? "dev",
    source: input.source ?? globalConfig?.defaultSource ?? "sdk",
  });
  return run_id;
}

export async function trackStep(input: {
  run_id: string;
  agent: string;
  workflow: string;
  step_name: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await sendEvent(baseEvent({
    run_id: input.run_id,
    event_type: "step",
    agent: input.agent,
    workflow: input.workflow,
    step_name: input.step_name,
    endpoint: `payment-ledger://step/${input.step_name}`,
    metadata: input.metadata,
  }));
}

export async function trackToolCall<T>(input: {
  run_id: string;
  agent: string;
  workflow: string;
  step_name: string;
  tool_name: string;
  endpoint?: string;
  fn: () => Promise<T>;
  metadata?: Record<string, unknown>;
}): Promise<T> {
  const started = Date.now();
  try {
    const result = await input.fn();
    await sendEvent(baseEvent({
      run_id: input.run_id,
      event_type: "tool_call",
      agent: input.agent,
      workflow: input.workflow,
      step_name: input.step_name,
      tool_name: input.tool_name,
      endpoint: input.endpoint ?? input.tool_name,
      latency_ms: Date.now() - started,
      metadata: input.metadata,
    }));
    return result;
  } catch (err) {
    await sendEvent(baseEvent({
      run_id: input.run_id,
      event_type: "tool_call",
      agent: input.agent,
      workflow: input.workflow,
      step_name: input.step_name,
      tool_name: input.tool_name,
      endpoint: input.endpoint ?? input.tool_name,
      latency_ms: Date.now() - started,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      metadata: input.metadata,
    }));
    throw err;
  }
}

export async function trackApproval(input: {
  run_id: string;
  agent: string;
  workflow: string;
  step_name: string;
  approval_status: "requested" | "approved" | "rejected" | "bypassed";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await sendEvent(baseEvent({
    run_id: input.run_id,
    event_type: "approval",
    agent: input.agent,
    workflow: input.workflow,
    step_name: input.step_name,
    endpoint: `human://approval/${input.step_name}`,
    approval_status: input.approval_status,
    metadata: input.metadata,
  }));
}

export async function trackPayment(input: {
  run_id: string;
  agent: string;
  workflow: string;
  endpoint: string;
  provider?: string;
  phase?: string;
  cost: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await sendEvent(baseEvent({
    run_id: input.run_id,
    event_type: "payment",
    agent: input.agent,
    workflow: input.workflow,
    endpoint: input.endpoint,
    provider: input.provider,
    phase: input.phase,
    cost: input.cost,
    currency: input.currency ?? "USDC",
    metadata: input.metadata,
  }));
}

export async function finishRun(input: {
  run_id: string;
  agent: string;
  workflow: string;
  status: "success" | "error";
  summary?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await sendEvent(baseEvent({
    run_id: input.run_id,
    event_type: "run_finish",
    agent: input.agent,
    workflow: input.workflow,
    endpoint: "payment-ledger://run/finish",
    status: input.status,
    summary: input.summary,
    metadata: input.metadata,
  }));
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
      run_id: opts.run_id,
      event_type: "payment",
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
