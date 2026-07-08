import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  type: z.enum(['income', 'expense']),
})
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
