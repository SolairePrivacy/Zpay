import axios from "axios";
import { env } from "../env";
import { logger } from "../logger";

interface BridgerCreateTransactionPayload {
  provider_name: string;
  currency_from: string;
  currency_to: string;
  to_address: string;
  to_extra_id?: string;
  amount: string;
  fixed: boolean;
}

interface BridgerTransaction {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  depositAddress: string;
  status: string;
  txTo?: string;
  raw: unknown;
}

export interface BridgerSwapParams {
  currencyFrom: string;
  currencyTo: string;
  amount: string;
  destinationAddress: string;
  destinationTag?: string;
  providerName?: string;
  fixed?: boolean;
}

function normalizeTransactionId(payload: Record<string, unknown>): string {
  const candidates = [payload.id, payload.transaction_id, payload.order_id, payload.transactionId];
  const id = candidates.find((value) => typeof value === "string");
  if (!id) {
    throw new Error("Bridger response missing transaction identifier");
  }
  return id;
}

function normalizeDepositAddress(payload: Record<string, unknown>): string {
  const candidates = [payload.payin_address, payload.deposit_address, payload.wallet_address];
  const address = candidates.find((value) => typeof value === "string" && value.length > 0) as string | undefined;
  if (!address) {
    throw new Error("Bridger response missing deposit address");
  }
  return address;
}

export async function createBridgerSwap(params: BridgerSwapParams): Promise<BridgerTransaction> {
  const payload: BridgerCreateTransactionPayload = {
    provider_name: params.providerName ?? env.BRIDGER_PROVIDER_NAME,
    currency_from: params.currencyFrom,
    currency_to: params.currencyTo,
    to_address: params.destinationAddress,
    to_extra_id: params.destinationTag,
    amount: params.amount,
    fixed: params.fixed ?? env.BRIDGER_FIXED_RATE,
  };

  const url = `${env.BRIDGER_API_BASE_URL.replace(/\/$/, "")}/createTransaction`;

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: env.BRIDGER_API_KEY,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: env.BRIDGER_TIMEOUT_MS,
    });

    const data = response.data as Record<string, unknown>;
    const result =
      typeof data.result === "object" && data.result !== null ? (data.result as Record<string, unknown>) : data;

    const transaction: BridgerTransaction = {
      id: normalizeTransactionId(result),
      fromCurrency: typeof result.currency_from === "string" ? result.currency_from : payload.currency_from,
      toCurrency: typeof result.currency_to === "string" ? result.currency_to : payload.currency_to,
      depositAddress: normalizeDepositAddress(result),
      status: typeof result.status === "string" ? result.status : "created",
      txTo: typeof result.tx_to === "string" ? result.tx_to : undefined,
      raw: data,
    };

    return transaction;
  } catch (error) {
    logger.error({ error }, "Bridger createTransaction failed");
    throw error;
  }
}


