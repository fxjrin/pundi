import { eq } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { users } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { verifyPassword, hashPassword, signAuthToken, buildAuthCookie, buildClearAuthCookie } from '../_lib/auth.js'
import { loginSchema, registerSchema } from '../../shared/schemas/auth.js'

async function login(request: Request): Promise<Response> {
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

async function register(request: Request): Promise<Response> {
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

async function logout(): Promise<Response> {
  return json({ message: 'Logged out' }, 200, { 'Set-Cookie': buildClearAuthCookie() })
}

// Consolidates login/register/logout into one function so the project stays under
// Vercel Hobby's 12-serverless-function limit; the action segment picks the handler.
export async function POST(request: Request): Promise<Response> {
  const action = new URL(request.url).pathname.split('/').filter(Boolean).pop()

  if (action === 'login') return login(request)
  if (action === 'register') return register(request)
  if (action === 'logout') return logout()

  return errorJson('Not found', 404)
}
