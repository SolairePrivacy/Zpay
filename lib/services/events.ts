import axios from "axios";
import { env } from "../env";
import { logger } from "../logger";

export interface PaymentEvent {
  type: string;
  sessionId: string;
  payload?: unknown;
  timestamp?: string;
}

function qstashConfigured(): boolean {
  return Boolean(env.QSTASH_TOKEN && env.QSTASH_TOPIC);
}

export function eventsEnabled(): boolean {
  return qstashConfigured();
}

export async function publishPaymentEvent(event: PaymentEvent): Promise<void> {
  if (!qstashConfigured()) {
    return;
  }

  const endpoint = `${env.QSTASH_URL.replace(/\/$/, "")}/publish/${env.QSTASH_TOPIC}`;
  const enriched: PaymentEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  try {
    await axios.post(endpoint, enriched, {
      headers: {
        Authorization: `Bearer ${env.QSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: env.QSTASH_TIMEOUT_MS,
    });
  } catch (error) {
    logger.error({ error }, "Failed to publish payment event");
  }
}

