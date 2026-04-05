# Examples

These are reference implementations showing how to integrate x402-insights with a live x402 facilitator.

They require a local [x402 workspace](https://github.com/coinbase/x402) to resolve `@x402/*` dependencies. They are not standalone — see the [adapter README](../adapters/facilitator-x402/) for the standalone install path.

## What's here

- `facilitator-basic-instrumented.ts` — shows the exact diff to add `attachInsights()` to the upstream `basic/index.ts` facilitator example
- `facilitator-driver.ts` — traffic simulator that runs the adapter code path against a hook-compatible shim (useful for local dev without testnet wallets)
