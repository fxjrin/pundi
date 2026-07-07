import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local' })

// Migrations run over the unpooled connection: DDL and drizzle-kit's own
// migration bookkeeping table are session-oriented, better served without a
// transaction pooler in front. The app itself (api/_lib/db.ts) uses the
// pooled DATABASE_URL instead.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set. Copy .env.example to .env.local first.')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './db/migrations',
  dbCredentials: { url },
})
