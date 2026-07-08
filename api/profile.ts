import { eq } from 'drizzle-orm'
import { db } from './_lib/db.js'
import { users } from '../db/schema.js'
import { json, errorJson } from './_lib/response.js'
import { requireUser, hashPassword, verifyPassword } from './_lib/auth.js'
import { updateProfileSchema } from '../shared/schemas/auth.js'

export async function GET(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, auth.id))
    .limit(1)
  if (!user) return errorJson('User not found', 404)

  return json({ user })
}

export async function PUT(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const body = await request.json().catch(() => null)
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) return errorJson('Invalid input', 400, parsed.error.flatten())

  const { name, currentPassword, newPassword } = parsed.data

  const [existing] = await db.select().from(users).where(eq(users.id, auth.id)).limit(1)
  if (!existing) return errorJson('User not found', 404)

  const updates: { name?: string; passwordHash?: string } = {}

  if (name) updates.name = name

  if (newPassword) {
    const ok = await verifyPassword(currentPassword!, existing.passwordHash)
    if (!ok) return errorJson('Current password is incorrect', 401)
    updates.passwordHash = await hashPassword(newPassword)
  }

  const [user] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, auth.id))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role })

  return json({ user })
}
