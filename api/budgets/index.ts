import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { budgets, categories } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { requireUser } from '../_lib/auth.js'
import { upsertBudgetSchema } from '../../shared/schemas/budget.js'
import { getBudgetProgress } from '../_lib/budget-progress.js'

const budgetQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
})

export async function GET(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const params = Object.fromEntries(new URL(request.url).searchParams)
  const parsed = budgetQuerySchema.safeParse(params)
  if (!parsed.success) return errorJson('Invalid query', 400, parsed.error.flatten())

  const now = new Date()
  const month = parsed.data.month ?? now.getMonth() + 1
  const year = parsed.data.year ?? now.getFullYear()

  const data = await getBudgetProgress(auth.id, month, year)
  return json({ data, month, year })
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const body = await request.json().catch(() => null)
  const parsed = upsertBudgetSchema.safeParse(body)
  if (!parsed.success) return errorJson('Invalid input', 400, parsed.error.flatten())
  const { categoryId, month, year, amount } = parsed.data

  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1)
  if (!category) return errorJson('Category not found', 404)
  if (category.userId !== null && category.userId !== auth.id) return errorJson('Forbidden', 403)
  // A budget is a spending limit; F12's progress calculation only ever sums expense
  // transactions, so an income category here could never show anything but 0%.
  if (category.type !== 'expense') return errorJson('Budgets can only be set for expense categories', 400)

  const [budget] = await db
    .insert(budgets)
    .values({ userId: auth.id, categoryId, month, year, amount })
    .onConflictDoUpdate({
      target: [budgets.userId, budgets.categoryId, budgets.month, budgets.year],
      set: { amount },
    })
    .returning()

  return json({ budget })
}

// Deleted by ?id= query param rather than a /[id] path segment -- this project's plain
// Vercel Functions setup (no framework) does not support Next.js-style optional catch-all
// dynamic routes, so list/upsert/delete for budgets share a single function this way,
// keeping the project under Vercel Hobby's 12-serverless-function limit.
export async function DELETE(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return errorJson('id is required', 400)

  const [budget] = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1)
  if (!budget) return errorJson('Budget not found', 404)
  if (budget.userId !== auth.id) return errorJson('Forbidden', 403)

  await db.delete(budgets).where(eq(budgets.id, id))
  return json({ message: 'Budget deleted' })
}
