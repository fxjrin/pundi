import { eq } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { transactions, categories } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { requireUser } from '../_lib/auth.js'
import { createTransactionSchema } from '../../shared/schemas/transaction.js'

async function loadOwnedTransaction(id: string, userId: string) {
  const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
  if (!transaction) return { error: errorJson('Transaction not found', 404) }
  if (transaction.userId !== userId) return { error: errorJson('Forbidden', 403) }
  return { transaction }
}

export async function PUT(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const id = new URL(request.url).pathname.split('/').pop()!
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

  const id = new URL(request.url).pathname.split('/').pop()!
  const { error } = await loadOwnedTransaction(id, auth.id)
  if (error) return error

  await db.delete(transactions).where(eq(transactions.id, id))
  return json({ message: 'Transaction deleted' })
}
