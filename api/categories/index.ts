import { and, eq, isNull, or } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { categories } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { requireUser } from '../_lib/auth.js'
import { createCategorySchema } from '../../shared/schemas/category.js'

export async function GET(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const type = new URL(request.url).searchParams.get('type')
  const scopeCondition = or(isNull(categories.userId), eq(categories.userId, auth.id))
  const where = type === 'income' || type === 'expense' ? and(scopeCondition, eq(categories.type, type)) : scopeCondition

  const rows = await db.select().from(categories).where(where)
  return json({ data: rows })
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const body = await request.json().catch(() => null)
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) return errorJson('Invalid input', 400, parsed.error.flatten())

  const [category] = await db
    .insert(categories)
    .values({ userId: auth.id, name: parsed.data.name, type: parsed.data.type, isDefault: false })
    .returning()

  return json({ category }, 201)
}
