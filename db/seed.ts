import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/neon-http'
import { isNull } from 'drizzle-orm'
import { categories } from './schema.js'

const DEFAULT_CATEGORIES: Array<{ name: string; type: 'income' | 'expense' }> = [
  { name: 'Makanan', type: 'expense' },
  { name: 'Transportasi', type: 'expense' },
  { name: 'Tagihan', type: 'expense' },
  { name: 'Hiburan', type: 'expense' },
  { name: 'Belanja', type: 'expense' },
  { name: 'Kesehatan', type: 'expense' },
  { name: 'Lainnya', type: 'expense' },
  { name: 'Gaji', type: 'income' },
  { name: 'Bonus', type: 'income' },
  { name: 'Lainnya', type: 'income' },
]

async function main() {
  const db = drizzle(process.env.DATABASE_URL!)

  // Idempotent: skip entirely if any global default category already exists, rather than
  // risk duplicate rows on a second run (categories has no DB-level unique constraint on name).
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(isNull(categories.userId))
    .limit(1)

  if (existing.length > 0) {
    console.log('Default categories already seeded, skipping.')
    return
  }

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((c) => ({
      userId: null,
      name: c.name,
      type: c.type,
      isDefault: true,
    }))
  )

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
