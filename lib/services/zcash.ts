import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { env } from "../env";
import { logger } from "../logger";
import { PaymentSession } from "../domain/payment";
import { getRedis } from "../redis";

interface RpcRequest {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params: unknown[];
}

interface RpcResponse<T> {
  result: T;
  error: null | {
    code: number;
    message: string;
  };
  id: string;
}

const ADDRESS_INDEX_KEY = "zcash:address_pool:index";

async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const request: RpcRequest = {
    jsonrpc: "2.0",
    id: randomUUID(),
    method,
    params,
  };

  const axiosConfig: {
    auth?:
      | {
          username: string;
          password: string;
        }
      | undefined;
    timeout: number;
  } = {
    timeout: 15_000,
  };

  if (env.ZCASH_RPC_COOKIE_PATH) {
    let rawCookie: string;
    try {
      rawCookie = await readFile(env.ZCASH_RPC_COOKIE_PATH, "utf8");
    } catch (error) {
      logger.error(
        { err: error },
        `Failed to read Zcash RPC cookie file at ${env.ZCASH_RPC_COOKIE_PATH}`
      );
      throw error;
    }

    const [username, password] = rawCookie.trim().split(":");
    if (!username || !password) {
      throw new Error(
        `Invalid cookie format in ${env.ZCASH_RPC_COOKIE_PATH}. Expected "username:password".`
      );
    }

    axiosConfig.auth = { username, password };
  } else if (env.ZCASH_RPC_USERNAME && env.ZCASH_RPC_PASSWORD) {
    axiosConfig.auth = {
      username: env.ZCASH_RPC_USERNAME,
      password: env.ZCASH_RPC_PASSWORD,
    };
  }

  try {
    // const endpoint = `${env.ZCASH_RPC_URL.replace(/\/$/, "")}/${env.GETBLOCK_API_KEY}/`;
    const endpoint = `${env.ZCASH_RPC_URL}`;

    const config: AxiosRequestConfig = {
      timeout: 15_000,
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: env.ZCASH_RPC_USERNAME ?? "",
        password: env.ZCASH_RPC_PASSWORD ?? "",
      },
    };

    const response = await axios.post<RpcResponse<T>>(
      endpoint,
      request,
      axiosConfig
    );

    if (response.data.error) {
      throw new Error(
        `Zcash RPC error: ${response.data.error.code} ${response.data.error.message}`
      );
    }

    return response.data.result;
  } catch (error) {
    logger.error({ error, rpcMethod: method }, "Failed to execute Zcash RPC call");
    throw error;
  }
}



async function rpcNowNodesCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const request: RpcRequest = {
    jsonrpc: "2.0",
    id: randomUUID(),
    method,
    params,
  };

  const axiosConfig: {
    auth?:
      | {
          username: string;
          password: string;
        }
      | undefined;
    timeout: number;
  } = {
    auth: {
      username: env.ZCASH_RPC_USERNAME ?? "",
    password: env.ZCASH_RPC_PASSWORD ?? ""
    },
    timeout: 15_000,
  };

  try {
    const endpoint = `${env.ZCASH_GETNODES_RPC_URL}`;

    const response = await axios.post<RpcResponse<T>>(
      endpoint,
      request,
      axiosConfig
    );

    if (response.data.error) {
      throw new Error(
        `Zcash RPC error: ${response.data.error.code} ${response.data.error.message}`
      );
    }

    return response.data.result;
  } catch (error) {
    logger.error({ error, rpcMethod: method }, "Failed to execute Zcash RPC call");
    throw error;
  }
}

export async function generateShieldedAddress(): Promise<string> {
  const addresses = ["t1Q23456789012345678901234567890123456789"];
  if (!addresses || addresses.length === 0) {
    throw new Error("ZCASH_SHIELDED_ADDRESSES is not configured");
  }

  try {
    const redis = getRedis();
    const nextIndex = await redis.incr(ADDRESS_INDEX_KEY);
    const normalizedIndex = (nextIndex - 1) % addresses.length;
    return addresses[normalizedIndex] ?? addresses[0];
  } catch (error) {
    logger.warn({ error }, "Falling back to in-memory Zcash address allocation");
    const randomIndex = Math.floor(Math.random() * addresses.length);
    return addresses[randomIndex];
  }
}

interface ReceivedTransaction {
  txid: string;
  amount: number;
  memo: string | null;
  confirmations: number;
}

export interface PaymentDetectionResult {
  detected: boolean;
  txId?: string;
  confirmations?: number;
}

export async function detectPayment(
  session: PaymentSession
): Promise<PaymentDetectionResult> {
  const result = await rpcCall<ReceivedTransaction[]>(
    "z_listreceivedbyaddress",
    [session.zcashAddress, env.PAYMENT_CONFIRMATIONS_REQUIRED]
  );

  logger.debug(
    { sessionId: session.id, transactions: result },
    "Zcash RPC payment detection result"
  );

  const match = result.find(
    (tx) =>
      Number(tx.amount) >= session.amountZec &&
      tx.confirmations >= env.PAYMENT_CONFIRMATIONS_REQUIRED
  );

  if (!match) {
    return { detected: false };
  }

  return {
    detected: true,
    txId: match.txid,
    confirmations: match.confirmations,
  };
}

export async function getZcashBlockCount(): Promise<number> {
  return rpcCall<number>("getblockcount");
}