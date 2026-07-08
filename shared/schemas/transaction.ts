import { z } from 'zod'

// Amount travels the wire as a string, never z.coerce.number(): JS numbers are not safe for
// money arithmetic, and Postgres numeric + Drizzle's string mode preserve exact precision
// end to end. This regex is the one and only place amount format is validated.
const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (up to 2 decimal places)')
  .refine((v) => Number(v) > 0, 'Amount must be greater than 0')

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  categoryId: z.string().uuid(),
  amount: amountSchema,
  note: z.string().trim().max(280).optional(),
  transactionDate: dateSchema,
  source: z.enum(['manual', 'ai_scan']).optional().default('manual'),
})
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().uuid().optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
})
export type TransactionQuery = z.infer<typeof transactionQuerySchema>
