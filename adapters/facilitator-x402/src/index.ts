/**
 * @x402-insights/facilitator — drop-in observability adapter for x402Facilitator.
 *
 * Usage:
 *   import { attachInsights } from "@x402-insights/facilitator";
 *   const facilitator = new x402Facilitator();
 *   attachInsights(facilitator, { baseUrl, apiKey, source: "facilitator-ts-example" });
 *
 * One call. Six hooks wired. Every /verify and /settle emits an event.
 * Never blocks or throws from the payment path.
 */

export interface AttachInsightsOptions {
  /** x402-insights backend URL, e.g. http://localhost:4000 */
  baseUrl: string;
  /** x-api-key header value */
  apiKey: string;
  /** Tag these events at ingestion (filters live vs demo). */
  source: string;
  /** "dev" | "prod" | custom */
  environment?: string;
  /** Logical agent name, e.g. "research-agent". Override per request via ctx hook if needed. */
  agent?: string;
  /** Logical workflow name. */
  workflow?: string;
  /**
   * Asset decimals for cost conversion. USDC = 6 (default).
   * If you accept mixed-decimal assets, set to `false` to skip conversion
   * and log the raw atomic amount as cost instead.
   */
  assetDecimals?: number | false;
  /** Override currency label. Defaults to inferring from network (USDC). */
  currency?: string;
  /** Disable logging of settle events (keeps only verify). Default false. */
  skipSettle?: boolean;
  /** Disable logging of verify events (keeps only settle — spend-only mode). Default false. */
  skipVerify?: boolean;
  /**
   * Custom function to derive a stable request_id from a payload.
   * Default: JSON.stringify(paymentPayload).
   */
  requestIdFn?: (paymentPayload: unknown) => string;
}

// Minimal surface of x402Facilitator we need — avoids hard dep on @x402/core types.
interface HookableFacilitator {
  onBeforeVerify(hook: (ctx: any) => Promise<any>): HookableFacilitator;
  onAfterVerify(hook: (ctx: any) => Promise<any>): HookableFacilitator;
  onVerifyFailure(hook: (ctx: any) => Promise<any>): HookableFacilitator;
  onBeforeSettle(hook: (ctx: any) => Promise<any>): HookableFacilitator;
  onAfterSettle(hook: (ctx: any) => Promise<any>): HookableFacilitator;
  onSettleFailure(hook: (ctx: any) => Promise<any>): HookableFacilitator;
}

interface TimerEntry {
  startedAt: number;
  retryCount: number;
}

function defaultRequestId(paymentPayload: unknown): string {
  try {
    return JSON.stringify(paymentPayload);
  } catch {
    return String(Math.random());
  }
}

function atomicToHuman(amount: string | number, decimals: number | false): number {
  const raw = typeof amount === "string" ? amount : String(amount);
  if (decimals === false) return Number(raw) || 0;
  if (!raw || raw === "0") return 0;
  try {
    const big = BigInt(raw);
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = big / divisor;
    const frac = big % divisor;
    return Number(whole) + Number(frac) / Number(divisor);
  } catch {
    return Number(raw) / Math.pow(10, decimals);
  }
}

function derivedProvider(requirements: any): string {
  if (!requirements) return "unknown";
  const net = requirements.network ?? "unknown";
  const scheme = requirements.scheme ?? "exact";
  return `${net}/${scheme}`;
}

function inferCurrency(requirements: any, override?: string): string {
  if (override) return override;
  return "USDC";
}

// v2 protocol renamed maxAmountRequired → amount. Read new field first, fall back for v1 back-compat.
function readAmount(requirements: any): string {
  return requirements?.amount ?? requirements?.maxAmountRequired ?? "0";
}

// Hook context field name varies across versions/hooks (requirements vs paymentRequirements).
function readRequirements(ctx: any): any {
  return ctx?.requirements ?? ctx?.paymentRequirements ?? {};
}

// v2 PaymentRequirements has no top-level resource field. Resource URL lives either
// on the top-level PaymentRequired response (not in hook ctx) or in extra.resourceUrl.
function readEndpoint(requirements: any): string {
  return (
    requirements?.extra?.resourceUrl ??
    requirements?.resource ??
    "unknown"
  );
}

export function attachInsights(
  facilitator: HookableFacilitator,
  opts: AttachInsightsOptions,
): HookableFacilitator {
  const {
    baseUrl,
    apiKey,
    source,
    environment = "dev",
    agent = "facilitator",
    workflow = "payment",
    assetDecimals = 6,
    currency,
    skipSettle = false,
    skipVerify = false,
    requestIdFn = defaultRequestId,
  } = opts;

  const timers = new Map<string, TimerEntry>();

  // Seen request_ids on verify → any subsequent verify with same id is a retry.
  const seenVerify = new Set<string>();
  // Seen request_ids on settle → subsequent settle with same id is a retry.
  const seenSettle = new Set<string>();

  async function emit(event: Record<string, unknown>): Promise<void> {
    try {
      await fetch(`${baseUrl}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          agent,
          workflow,
          environment,
          source,
          currency: event.currency ?? "USDC",
          ...event,
        }),
      });
    } catch (err) {
      console.warn("[x402-insights] emit failed:", err);
    }
  }

  if (!skipVerify) {
    facilitator.onBeforeVerify(async (ctx: any) => {
      const reqId = requestIdFn(ctx?.paymentPayload);
      const isRetry = seenVerify.has(reqId);
      timers.set("verify:" + reqId, { startedAt: Date.now(), retryCount: isRetry ? 1 : 0 });
      seenVerify.add(reqId);
    });

    facilitator.onAfterVerify(async (ctx: any) => {
      const reqId = requestIdFn(ctx?.paymentPayload);
      const t = timers.get("verify:" + reqId);
      timers.delete("verify:" + reqId);
      const latency_ms = t ? Date.now() - t.startedAt : 0;
      const req = readRequirements(ctx);
      void emit({
        endpoint: readEndpoint(req),
        provider: derivedProvider(req),
        currency: inferCurrency(req, currency),
        cost: 0, // verify doesn't spend
        latency_ms,
        status: "success",
        status_code: 200,
        retry_count: t?.retryCount ?? 0,
        is_retry: (t?.retryCount ?? 0) > 0,
        request_id: reqId.slice(0, 64),
        phase: "verify",
      });
    });

    facilitator.onVerifyFailure(async (ctx: any) => {
      const reqId = requestIdFn(ctx?.paymentPayload);
      const t = timers.get("verify:" + reqId);
      timers.delete("verify:" + reqId);
      const latency_ms = t ? Date.now() - t.startedAt : 0;
      const req = readRequirements(ctx);
      void emit({
        endpoint: readEndpoint(req),
        provider: derivedProvider(req),
        currency: inferCurrency(req, currency),
        cost: 0,
        latency_ms,
        status: "error",
        status_code: 402,
        retry_count: t?.retryCount ?? 0,
        is_retry: (t?.retryCount ?? 0) > 0,
        request_id: reqId.slice(0, 64),
        error: ctx?.error?.message ?? "verify failed",
        phase: "verify",
      });
    });
  }

  if (!skipSettle) {
    facilitator.onBeforeSettle(async (ctx: any) => {
      const reqId = requestIdFn(ctx?.paymentPayload);
      const isRetry = seenSettle.has(reqId);
      timers.set("settle:" + reqId, { startedAt: Date.now(), retryCount: isRetry ? 1 : 0 });
      seenSettle.add(reqId);
    });

    facilitator.onAfterSettle(async (ctx: any) => {
      const reqId = requestIdFn(ctx?.paymentPayload);
      const t = timers.get("settle:" + reqId);
      timers.delete("settle:" + reqId);
      const latency_ms = t ? Date.now() - t.startedAt : 0;
      const req = readRequirements(ctx);
      const cost = atomicToHuman(readAmount(req), assetDecimals);
      void emit({
        endpoint: readEndpoint(req),
        provider: derivedProvider(req),
        currency: inferCurrency(req, currency),
        cost,
        latency_ms,
        status: "success",
        status_code: 200,
        retry_count: t?.retryCount ?? 0,
        is_retry: (t?.retryCount ?? 0) > 0,
        request_id: reqId.slice(0, 64),
        phase: "settle",
      });
    });

    facilitator.onSettleFailure(async (ctx: any) => {
      const reqId = requestIdFn(ctx?.paymentPayload);
      const t = timers.get("settle:" + reqId);
      timers.delete("settle:" + reqId);
      const latency_ms = t ? Date.now() - t.startedAt : 0;
      const req = readRequirements(ctx);
      const cost = atomicToHuman(readAmount(req), assetDecimals);
      void emit({
        endpoint: readEndpoint(req),
        provider: derivedProvider(req),
        currency: inferCurrency(req, currency),
        cost, // charge still counted — retry waste appears here
        latency_ms,
        status: "error",
        status_code: 500,
        retry_count: t?.retryCount ?? 0,
        is_retry: (t?.retryCount ?? 0) > 0,
        request_id: reqId.slice(0, 64),
        error: ctx?.error?.message ?? "settle failed",
        phase: "settle",
      });
    });
  }

  return facilitator;
}
