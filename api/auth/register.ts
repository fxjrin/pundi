import { eq } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { users } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { hashPassword, signAuthToken, buildAuthCookie } from '../_lib/auth.js'
import { registerSchema } from '../../shared/schemas/auth.js'

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return errorJson('Invalid input', 400, parsed.error.flatten())

  const { name, email, password } = parsed.data

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) return errorJson('Email is already registered', 409)

  const passwordHash = await hashPassword(password)
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role })

  const token = await signAuthToken({ id: user.id, role: user.role })

  return json({ user }, 201, { 'Set-Cookie': buildAuthCookie(token) })
}
