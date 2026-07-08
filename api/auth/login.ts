import { eq } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { users } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { verifyPassword, signAuthToken, buildAuthCookie } from '../_lib/auth.js'
import { loginSchema } from '../../shared/schemas/auth.js'

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return errorJson('Invalid input', 400, parsed.error.flatten())

  const { email, password } = parsed.data

  // Same generic message whether the email doesn't exist or the password is wrong, so a
  // caller can't use this endpoint to enumerate which emails are registered.
  const invalid = () => errorJson('Invalid email or password', 401)

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) return invalid()

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return invalid()

  const token = await signAuthToken({ id: user.id, role: user.role })

  return json(
    { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    200,
    { 'Set-Cookie': buildAuthCookie(token) }
  )
}
