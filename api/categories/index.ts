import { and, eq, isNull, or } from 'drizzle-orm'
import { db, isForeignKeyViolation } from '../_lib/db.js'
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

// Deleted by ?id= query param rather than a /[id] path segment -- this project's plain
// Vercel Functions setup (no framework) does not support Next.js-style optional catch-all
// dynamic routes, so list/create/delete for one resource share a single function this way,
// keeping the project under Vercel Hobby's 12-serverless-function limit.
export async function DELETE(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return errorJson('id is required', 400)

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
