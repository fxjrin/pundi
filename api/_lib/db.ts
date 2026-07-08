import { drizzle } from 'drizzle-orm/neon-http'
import { NeonDbError } from '@neondatabase/serverless'
import * as schema from '../../db/schema.js'
import { env } from './env.js'

// Module-level singleton: Vercel Functions reuse a warm module scope across invocations
// on the same instance, so this avoids re-creating the client on every request. The
// neon-http driver is HTTP-based (no persistent TCP connection to pool), so it is safe
// to share across concurrent invocations without a connection-pool exhaustion risk.
export const db = drizzle(env.DATABASE_URL, { schema })

const FOREIGN_KEY_VIOLATION = '23503'

// Drizzle wraps the real Postgres error in a DrizzleQueryError, with the actual NeonDbError
// (which carries the Postgres error code) nested at `.cause` -- checking `err.code` directly
// on the caught error never matches, it is always undefined one level too shallow.
export function isForeignKeyViolation(err: unknown): boolean {
  const cause = err instanceof Error && err.cause instanceof Error ? err.cause : err
  return cause instanceof NeonDbError && cause.code === FOREIGN_KEY_VIOLATION
}
