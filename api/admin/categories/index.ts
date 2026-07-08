import { isNull, eq } from 'drizzle-orm'
import { db } from '../../_lib/db.js'
import { categories } from '../../../db/schema.js'
import { json, errorJson } from '../../_lib/response.js'
import { requireAdmin } from '../../_lib/auth.js'
import { createCategorySchema } from '../../../shared/schemas/category.js'

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const rows = await db.select().from(categories).where(isNull(categories.userId))
  return json({ data: rows })
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = await request.json().catch(() => null)
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) return errorJson('Invalid input', 400, parsed.error.flatten())

  const [category] = await db
    .insert(categories)
    .values({ userId: null, name: parsed.data.name, type: parsed.data.type, isDefault: true })
    .returning()

  return json({ category }, 201)
}

// Toggled by ?id= query param rather than a /[id] path segment -- this project's plain
// Vercel Functions setup (no framework) does not support Next.js-style optional catch-all
// dynamic routes, so list/create/toggle share a single function this way, keeping the
// project under Vercel Hobby's 12-serverless-function limit. Toggles is_default, which
// doubles as the active flag for global categories (see db/schema.ts) -- existing
// transactions/budgets keep referencing the row unchanged.
export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return errorJson('id is required', 400)

  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!category || category.userId !== null) return errorJson('Global category not found', 404)

  const [updated] = await db
    .update(categories)
    .set({ isDefault: !category.isDefault })
    .where(eq(categories.id, id))
    .returning()

  return json({ category: updated })
}
