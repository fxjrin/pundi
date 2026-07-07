import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../../db/schema.js'
import { env } from './env.js'

// Module-level singleton: Vercel Functions reuse a warm module scope across invocations
// on the same instance, so this avoids re-creating the client on every request. The
// neon-http driver is HTTP-based (no persistent TCP connection to pool), so it is safe
// to share across concurrent invocations without a connection-pool exhaustion risk.
export const db = drizzle(env.DATABASE_URL, { schema })
