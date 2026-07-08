import { eq } from 'drizzle-orm'
import { db } from '../../_lib/db.js'
import { categories } from '../../../db/schema.js'
import { json, errorJson } from '../../_lib/response.js'
import { requireAdmin } from '../../_lib/auth.js'

// Toggles is_default, which doubles as the active flag for global categories (see
// db/schema.ts) -- existing transactions/budgets keep referencing the row unchanged.
export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const id = new URL(request.url).pathname.split('/').pop()!

  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!category || category.userId !== null) return errorJson('Global category not found', 404)

  const [updated] = await db
    .update(categories)
    .set({ isDefault: !category.isDefault })
    .where(eq(categories.id, id))
    .returning()

  return json({ category: updated })
}
