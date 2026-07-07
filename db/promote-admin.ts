import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { users } from './schema.js'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npx tsx db/promote-admin.ts <email>')
    process.exit(1)
  }

  const db = drizzle(process.env.DATABASE_URL!)

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }

  if (user.role === 'admin') {
    console.log(`${email} is already an admin.`)
    return
  }

  await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id))
  console.log(`${email} is now an admin.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
