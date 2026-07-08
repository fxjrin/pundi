import { z } from 'zod'

// Same money-string pattern as shared/schemas/transaction.ts: amount always travels the wire
// as a string, validated here, never z.coerce.number().
const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (up to 2 decimal places)')
  .refine((v) => Number(v) > 0, 'Amount must be greater than 0')

export const upsertBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  // Plain z.number(), not z.coerce.number(): this schema is shared with the frontend form,
  // and coerce fields type z.input as unknown, which react-hook-form cannot bind to a control.
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  amount: amountSchema,
})
export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>
