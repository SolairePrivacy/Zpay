import { z } from "zod";

export const SolanaActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("record_only"),
  }),
  z.object({
    type: z.literal("send_sol"),
    destination: z.string().min(1, "Destination address is required"),
    lamports: z.coerce.number().int().positive(),
  }),
  z.object({
    type: z.literal("send_spl"),
    destination: z.string().min(1),
    mint: z.string().min(1),
    amount: z.string().min(1),
    decimals: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("program_invoke"),
    programId: z.string().min(1),
    accounts: z
      .array(
        z.object({
          pubkey: z.string().min(1),
          isSigner: z.boolean().default(false),
          isWritable: z.boolean().default(false),
        })
      )
      .min(1),
    data: z.string().min(1, "Instruction data must be base64 encoded"),
  }),
]);

export type SolanaActionInput = z.input<typeof SolanaActionSchema>;
export type SolanaAction = z.infer<typeof SolanaActionSchema>;

export const PaymentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "executed",
  "expired",
  "failed",
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentSessionSchema = z.object({
  id: z.string().uuid(),
  zcashAddress: z.string().min(1),
  amountZec: z.number().positive(),
  confirmationsRequired: z.number().int().positive(),
  targetAction: SolanaActionSchema,
  merchantId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  status: PaymentStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string(),
  zcashTxId: z.string().optional(),
  solanaTxId: z.string().optional(),
  bridgerTransactionId: z.string().optional(),
  bridgerDepositAddress: z.string().optional(),
  errorReason: z.string().optional(),
});

export type PaymentSession = z.infer<typeof PaymentSessionSchema>;

