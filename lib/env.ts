import { z } from "zod";

const envSchema = z
  .object({
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
    ZCASH_GETNODES_RPC_URL: z.string().url(),
    ZCASH_RPC_USERNAME: z.string().min(1).optional(),
    ZCASH_RPC_PASSWORD: z.string().min(1).optional(),
    ZCASH_RPC_COOKIE_PATH: z.string().min(1).optional(),
    SOLANA_RPC_URL: z.string().url(),
    SOLANA_CUSTODIAL_PRIVATE_KEY: z.string().min(1),
    SOLANA_DEFAULT_COMMITMENT: z
      .enum(["processed", "confirmed", "finalized"])
      .default("confirmed"),
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
  })
  .superRefine((data, ctx) => {
    const hasUsername = Boolean(data.ZCASH_RPC_USERNAME);
    const hasPassword = Boolean(data.ZCASH_RPC_PASSWORD);

    if (hasUsername !== hasPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasUsername ? ["ZCASH_RPC_PASSWORD"] : ["ZCASH_RPC_USERNAME"],
        message:
          "ZCASH_RPC_USERNAME and ZCASH_RPC_PASSWORD must both be provided when using basic authentication.",
      });
    }

    if (data.ZCASH_RPC_COOKIE_PATH && (hasUsername || hasPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ZCASH_RPC_COOKIE_PATH"],
        message:
          "Provide either ZCASH_RPC_COOKIE_PATH or basic auth credentials, but not both.",
      });
    }
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
  ZCASH_GETNODES_RPC_URL: process.env.ZCASH_GETNODES_RPC_URL,
  ZCASH_RPC_COOKIE_PATH: process.env.ZCASH_RPC_COOKIE_PATH,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  SOLANA_CUSTODIAL_PRIVATE_KEY: process.env.SOLANA_CUSTODIAL_PRIVATE_KEY,
  SOLANA_DEFAULT_COMMITMENT: process.env.SOLANA_DEFAULT_COMMITMENT,
  BRIDGER_API_BASE_URL: process.env.BRIDGER_API_BASE_URL,
  BRIDGER_API_KEY: process.env.BRIDGER_API_KEY,
  BRIDGER_PROVIDER_NAME: process.env.BRIDGER_PROVIDER_NAME,
  BRIDGER_FIXED_RATE: process.env.BRIDGER_FIXED_RATE,
  BRIDGER_TIMEOUT_MS: process.env.BRIDGER_TIMEOUT_MS,
  QSTASH_URL: process.env.QSTASH_URL,
  QSTASH_TOKEN: process.env.QSTASH_TOKEN,
  QSTASH_TOPIC: process.env.QSTASH_TOPIC,
  QSTASH_TIMEOUT_MS: process.env.QSTASH_TIMEOUT_MS,
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

