import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { transactions, categories } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { requireUser } from '../_lib/auth.js'
import { createTransactionSchema, transactionQuerySchema } from '../../shared/schemas/transaction.js'

// Update/delete use ?id= query param rather than a /[id] path segment -- this project's
// plain Vercel Functions setup (no framework) does not support Next.js-style optional
// catch-all dynamic routes, so list/create/update/delete share a single function this
// way, keeping the project under Vercel Hobby's 12-serverless-function limit. export.ts
// stays a separate function since it is a distinct read-only report, not a CRUD op.
async function loadOwnedTransaction(id: string, userId: string) {
  const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
  if (!transaction) return { error: errorJson('Transaction not found', 404) }
  if (transaction.userId !== userId) return { error: errorJson('Forbidden', 403) }
  return { transaction }
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const params = Object.fromEntries(new URL(request.url).searchParams)
  const parsed = transactionQuerySchema.safeParse(params)
  if (!parsed.success) return errorJson('Invalid query', 400, parsed.error.flatten())
  const { page, limit, type, categoryId, dateFrom, dateTo } = parsed.data

  const where = and(
    eq(transactions.userId, auth.id),
    type ? eq(transactions.type, type) : undefined,
    categoryId ? eq(transactions.categoryId, categoryId) : undefined,
    dateFrom ? gte(transactions.transactionDate, dateFrom) : undefined,
    dateTo ? lte(transactions.transactionDate, dateTo) : undefined
  )

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        note: transactions.note,
        transactionDate: transactions.transactionDate,
        source: transactions.source,
        createdAt: transactions.createdAt,
        category: { id: categories.id, name: categories.name },
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(where)
      .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(transactions).where(where),
  ])

  return json({
    data: rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  })
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const body = await request.json().catch(() => null)
  const parsed = createTransactionSchema.safeParse(body)
  if (!parsed.success) return errorJson('Invalid input', 400, parsed.error.flatten())
  const { type, categoryId, amount, note, transactionDate, source } = parsed.data

  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1)
  if (!category) return errorJson('Category not found', 404)
  if (category.userId !== null && category.userId !== auth.id) return errorJson('Forbidden', 403)
  if (category.type !== type) return errorJson(`This category is for ${category.type}, not ${type}`, 400)

  const [transaction] = await db
    .insert(transactions)
    .values({ userId: auth.id, categoryId, type, amount, note, transactionDate, source })
    .returning()

  return json({ transaction }, 201)
}

export async function PUT(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return errorJson('id is required', 400)
  const { error } = await loadOwnedTransaction(id, auth.id)
  if (error) return error

  const body = await request.json().catch(() => null)
  const parsed = createTransactionSchema.safeParse(body)
  if (!parsed.success) return errorJson('Invalid input', 400, parsed.error.flatten())
  const { type, categoryId, amount, note, transactionDate, source } = parsed.data

  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1)
  if (!category) return errorJson('Category not found', 404)
  if (category.userId !== null && category.userId !== auth.id) return errorJson('Forbidden', 403)
  if (category.type !== type) return errorJson(`This category is for ${category.type}, not ${type}`, 400)

  const [transaction] = await db
    .update(transactions)
    .set({ type, categoryId, amount, note, transactionDate, source })
    .where(eq(transactions.id, id))
    .returning()

  return json({ transaction })
}

export async function DELETE(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return errorJson('id is required', 400)
  const { error } = await loadOwnedTransaction(id, auth.id)
  if (error) return error

  await db.delete(transactions).where(eq(transactions.id, id))
  return json({ message: 'Transaction deleted' })
}
