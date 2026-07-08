import { isNull } from 'drizzle-orm'
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
