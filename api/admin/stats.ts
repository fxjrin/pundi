import { and, count, eq, isNull } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { users, transactions, categories } from '../../db/schema.js'
import { json } from '../_lib/response.js'
import { requireAdmin } from '../_lib/auth.js'

// Aggregate counts only -- must never expose any per-user financial detail (F16).
export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const [[{ totalUsers }], [{ totalTransactions }], [{ totalCategoriesGlobal }]] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ totalTransactions: count() }).from(transactions),
    db
      .select({ totalCategoriesGlobal: count() })
      .from(categories)
      .where(and(isNull(categories.userId), eq(categories.isDefault, true))),
  ])

  return json({ totalUsers, totalTransactions, totalCategoriesGlobal })
}
