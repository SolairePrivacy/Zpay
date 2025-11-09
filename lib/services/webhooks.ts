import axios from "axios";
import { createHmac } from "node:crypto";
import { env } from "../env";
import { logger } from "../logger";
import { PaymentSession } from "../domain/payment";

interface WebhookEvent {
  type: string;
  session: PaymentSession;
  timestamp?: string;
}

function buildSignature(payload: string) {
  if (!env.MERCHANT_WEBHOOK_SECRET) {
    return null;
  }
  return createHmac("sha256", env.MERCHANT_WEBHOOK_SECRET).update(payload).digest("hex");
}

export async function sendMerchantWebhook(event: WebhookEvent) {
  if (!env.MERCHANT_WEBHOOK_URL) {
    return;
  }
  try {
    const timestamp = event.timestamp ?? new Date().toISOString();
    const body = JSON.stringify({
      type: event.type,
      session: event.session,
      timestamp,
    });
    const signature = buildSignature(body);
    await axios.post(env.MERCHANT_WEBHOOK_URL, body, {
      headers: {
        "Content-Type": "application/json",
        ...(signature ? { "X-ZPay-Signature": signature } : {}),
      },
      timeout: 10000,
    });
  } catch (error) {
    logger.error({ error }, "Failed to dispatch merchant webhook");
  }
}

