import { eq } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { budgets } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { requireUser } from '../_lib/auth.js'

export async function DELETE(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const id = new URL(request.url).pathname.split('/').pop()!

  const [budget] = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1)
  if (!budget) return errorJson('Budget not found', 404)
  if (budget.userId !== auth.id) return errorJson('Forbidden', 403)

  await db.delete(budgets).where(eq(budgets.id, id))
  return json({ message: 'Budget deleted' })
}
