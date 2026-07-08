import { eq } from 'drizzle-orm'
import { db, isForeignKeyViolation } from '../_lib/db.js'
import { categories } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { requireUser } from '../_lib/auth.js'

export async function DELETE(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const id = new URL(request.url).pathname.split('/').pop()!

  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!category) return errorJson('Category not found', 404)
  if (category.userId !== auth.id) return errorJson('Forbidden', 403)

  try {
    await db.delete(categories).where(eq(categories.id, id))
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      return errorJson('This category still has transactions or budgets attached to it', 409)
    }
    throw err
  }

  return json({ message: 'Category deleted' })
}
