/**
 * Instrumented copy of x402-pr1932/examples/typescript/facilitator/basic/index.ts
 *
 * THE ONLY CHANGE from the upstream example is the two-line attachInsights() call.
 * Drop in the same pattern on any x402Facilitator to get spend observability.
 */
import { base58 } from "@scure/base";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Facilitator } from "@x402/core/facilitator";
import {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  VerifyResponse,
} from "@x402/core/types";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import { toFacilitatorSvmSigner } from "@x402/svm";
import { ExactSvmScheme } from "@x402/svm/exact/facilitator";
import { attachInsights } from "@x402-insights/facilitator"; // <-- ADDED
import dotenv from "dotenv";
import express from "express";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

dotenv.config();

const PORT = process.env.PORT || "4022";

if (!process.env.EVM_PRIVATE_KEY) { console.error("EVM_PRIVATE_KEY required"); process.exit(1); }
if (!process.env.SVM_PRIVATE_KEY) { console.error("SVM_PRIVATE_KEY required"); process.exit(1); }

const evmAccount = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
const svmAccount = await createKeyPairSignerFromBytes(base58.decode(process.env.SVM_PRIVATE_KEY as string));

const viemClient = createWalletClient({
  account: evmAccount, chain: baseSepolia, transport: http(),
}).extend(publicActions);

const evmSigner = toFacilitatorEvmSigner({
  getCode: (args) => viemClient.getCode(args),
  address: evmAccount.address,
  readContract: (args) => viemClient.readContract({ ...args, args: args.args || [] }),
  verifyTypedData: (args) => viemClient.verifyTypedData(args as any),
  writeContract: (args) => viemClient.writeContract({ ...args, args: args.args || [] }),
  sendTransaction: (args) => viemClient.sendTransaction(args),
  waitForTransactionReceipt: (args) => viemClient.waitForTransactionReceipt(args),
});
const svmSigner = toFacilitatorSvmSigner(svmAccount);

const facilitator = new x402Facilitator();

// ============================================================================
// x402-insights integration — ONE CALL, six hooks wired, zero core-logic changes
// ============================================================================
attachInsights(facilitator, {
  baseUrl: process.env.INSIGHTS_URL ?? "http://localhost:4000",
  apiKey:  process.env.INSIGHTS_API_KEY ?? "dev-key",
  source:  "facilitator-ts-example",
  environment: process.env.NODE_ENV ?? "dev",
  agent: "basic-facilitator",
  workflow: "verify-and-settle",
});
// ============================================================================

facilitator
  .onBeforeVerify(async (ctx) => console.log("Before verify", ctx))
  .onAfterVerify(async (ctx) => console.log("After verify", ctx));

facilitator.register("eip155:84532", new ExactEvmScheme(evmSigner, { deployERC4337WithEIP6492: true }));
facilitator.register("solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", new ExactSvmScheme(svmSigner));

const app = express();
app.use(express.json());

app.post("/verify", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;
    if (!paymentPayload || !paymentRequirements) return res.status(400).json({ error: "missing" });
    const r: VerifyResponse = await facilitator.verify(paymentPayload, paymentRequirements);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : "unknown" }); }
});

app.post("/settle", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;
    if (!paymentPayload || !paymentRequirements) return res.status(400).json({ error: "missing" });
    const r: SettleResponse = await facilitator.settle(paymentPayload, paymentRequirements);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : "unknown" }); }
});

app.get("/supported", async (_req, res) => res.json(facilitator.getSupported()));

app.listen(parseInt(PORT), () => console.log(`Facilitator (instrumented) on http://localhost:${PORT}`));
