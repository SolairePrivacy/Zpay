import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  UPSTASH_REDIS_DEFAULT_TTL_SECONDS: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 86400))
    .refine((val) => Number.isFinite(val) && val > 0, {
      message: "UPSTASH_REDIS_DEFAULT_TTL_SECONDS must be a positive integer",
    }),
  PAYMENT_CONFIRMATIONS_REQUIRED: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 3))
    .refine((val) => Number.isFinite(val) && val >= 1, {
      message: "PAYMENT_CONFIRMATIONS_REQUIRED must be an integer >= 1",
    }),
  ZCASH_RPC_URL: z.string().url(),
  ZCASH_RPC_USERNAME: z.string().min(1),
  ZCASH_RPC_PASSWORD: z.string().min(1),
  SOLANA_RPC_URL: z.string().url(),
  SOLANA_CUSTODIAL_PRIVATE_KEY: z.string().min(1),
  SOLANA_DEFAULT_COMMITMENT: z
    .enum(["processed", "confirmed", "finalized"])
    .default("confirmed"),
  FLASHIFT_API_BASE_URL: z
    .string()
    .url()
    .default("https://interface.flashift.app/api/dev/v1"),
  FLASHIFT_API_KEY: z.string().min(1),
  FLASHIFT_PROVIDER_NAME: z.string().default("Exolix"),
  FLASHIFT_FIXED_RATE: z
    .string()
    .optional()
    .transform((val) => (val ? val.toLowerCase() === "true" : false)),
  FLASHIFT_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 20000))
    .refine((val) => Number.isFinite(val) && val > 0, {
      message: "FLASHIFT_TIMEOUT_MS must be a positive integer",
    }),
  UPSTASH_KAFKA_REST_URL: z.string().url().optional(),
  UPSTASH_KAFKA_REST_USERNAME: z.string().optional(),
  UPSTASH_KAFKA_REST_PASSWORD: z.string().optional(),
  UPSTASH_KAFKA_TOPIC: z.string().optional(),
  UPSTASH_KAFKA_CONSUMER_GROUP: z.string().default("zpay-payments"),
  UPSTASH_KAFKA_CONSUMER_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 2000))
    .refine((val) => Number.isFinite(val) && val > 0, {
      message: "UPSTASH_KAFKA_CONSUMER_TIMEOUT_MS must be a positive integer",
    }),
  MERCHANT_WEBHOOK_URL: z.string().url().optional(),
  MERCHANT_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_DEFAULT_TTL_SECONDS: process.env.UPSTASH_REDIS_DEFAULT_TTL_SECONDS,
  PAYMENT_CONFIRMATIONS_REQUIRED: process.env.PAYMENT_CONFIRMATIONS_REQUIRED,
  ZCASH_RPC_URL: process.env.ZCASH_RPC_URL,
  ZCASH_RPC_USERNAME: process.env.ZCASH_RPC_USERNAME,
  ZCASH_RPC_PASSWORD: process.env.ZCASH_RPC_PASSWORD,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  SOLANA_CUSTODIAL_PRIVATE_KEY: process.env.SOLANA_CUSTODIAL_PRIVATE_KEY,
  SOLANA_DEFAULT_COMMITMENT: process.env.SOLANA_DEFAULT_COMMITMENT,
  FLASHIFT_API_BASE_URL: process.env.FLASHIFT_API_BASE_URL,
  FLASHIFT_API_KEY: process.env.FLASHIFT_API_KEY,
  FLASHIFT_PROVIDER_NAME: process.env.FLASHIFT_PROVIDER_NAME,
  FLASHIFT_FIXED_RATE: process.env.FLASHIFT_FIXED_RATE,
  FLASHIFT_TIMEOUT_MS: process.env.FLASHIFT_TIMEOUT_MS,
  UPSTASH_KAFKA_REST_URL: process.env.UPSTASH_KAFKA_REST_URL,
  UPSTASH_KAFKA_REST_USERNAME: process.env.UPSTASH_KAFKA_REST_USERNAME,
  UPSTASH_KAFKA_REST_PASSWORD: process.env.UPSTASH_KAFKA_REST_PASSWORD,
  UPSTASH_KAFKA_TOPIC: process.env.UPSTASH_KAFKA_TOPIC,
  UPSTASH_KAFKA_CONSUMER_GROUP: process.env.UPSTASH_KAFKA_CONSUMER_GROUP,
  UPSTASH_KAFKA_CONSUMER_TIMEOUT_MS: process.env.UPSTASH_KAFKA_CONSUMER_TIMEOUT_MS,
  MERCHANT_WEBHOOK_URL: process.env.MERCHANT_WEBHOOK_URL,
  MERCHANT_WEBHOOK_SECRET: process.env.MERCHANT_WEBHOOK_SECRET,
});

if (!parsed.success) {
  // Avoid leaking secrets in thrown error
  const formatted = parsed.error.flatten();
  throw new Error(
    `Invalid environment configuration: ${JSON.stringify(formatted.fieldErrors)}`
  );
}

export const env = parsed.data;

export type Env = typeof env;

