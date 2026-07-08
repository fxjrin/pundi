import { hash, compare } from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { env } from './env.js'
import { errorJson } from './response.js'

const COOKIE_NAME = 'pundi_session'
const TOKEN_TTL = '7d'
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

const secretKey = new TextEncoder().encode(env.JWT_SECRET)

export type AuthRole = 'user' | 'admin'
export interface AuthUser {
  id: string
  role: AuthRole
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash)
}

export async function signAuthToken(user: AuthUser): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey)
}

async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    if (typeof payload.sub !== 'string') return null
    if (payload.role !== 'user' && payload.role !== 'admin') return null
    return { id: payload.sub, role: payload.role }
  } catch {
    return null
  }
}

// A cookie set from a plain `vercel dev` (http://localhost) cannot carry the Secure
// attribute, browsers silently drop it. VERCEL_ENV is 'development' there and 'preview' or
// 'production' (always HTTPS) everywhere Vercel actually deploys, so this is the one
// condition that needs to vary between local dev and every real deployment.
const isSecureContext = process.env.VERCEL_ENV !== 'development'

export function buildAuthCookie(token: string): string {
  const attrs = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${TOKEN_TTL_SECONDS}`,
  ]
  if (isSecureContext) attrs.push('Secure')
  return attrs.join('; ')
}

export function buildClearAuthCookie(): string {
  const attrs = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0']
  if (isSecureContext) attrs.push('Secure')
  return attrs.join('; ')
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim())
  }
  return null
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = readCookie(request, COOKIE_NAME)
  if (!token) return null
  return verifyAuthToken(token)
}

/** Every protected handler starts with this; if it returns a Response, return it as-is. */
export async function requireUser(request: Request): Promise<AuthUser | Response> {
  const user = await getAuthUser(request)
  if (!user) return errorJson('Not authenticated', 401)
  return user
}

export async function requireAdmin(request: Request): Promise<AuthUser | Response> {
  const result = await requireUser(request)
  if (result instanceof Response) return result
  if (result.role !== 'admin') return errorJson('Forbidden', 403)
  return result
}
