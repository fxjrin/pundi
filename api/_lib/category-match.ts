import { and, eq, isNull, or } from 'drizzle-orm'
import { db } from './db.js'
import { categories } from '../../db/schema.js'

export interface ExpenseCategoryOption {
  id: string
  name: string
}

/**
 * The user's expense categories (global defaults union the user's own, same scope as
 * GET /api/categories) -- shared by the Gemini prompt (which category names to choose
 * from) and matchCategoryId (which id a chosen name maps back to).
 */
export async function getExpenseCategoryOptions(userId: string): Promise<ExpenseCategoryOption[]> {
  const scopeCondition = or(isNull(categories.userId), eq(categories.userId, userId))
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(scopeCondition, eq(categories.type, 'expense')))
}

/**
 * Best-effort case-insensitive match between Gemini's free-text category guess and the
 * given expense category options. Returns null rather than guessing wrong when nothing
 * matches -- the user picks a category manually in that case.
 */
export function matchCategoryId(options: ExpenseCategoryOption[], categoryGuess: string | null): string | null {
  if (!categoryGuess) return null
  const guess = categoryGuess.trim().toLowerCase()
  if (!guess) return null

  const exact = options.find((category) => category.name.toLowerCase() === guess)
  if (exact) return exact.id

  const partial = options.find(
    (category) => category.name.toLowerCase().includes(guess) || guess.includes(category.name.toLowerCase())
  )
  return partial?.id ?? null
}
