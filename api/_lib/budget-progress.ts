import { and, eq, sql, sum } from 'drizzle-orm'
import { db } from './db.js'
import { budgets, categories, transactions } from '../../db/schema.js'

export type BudgetStatus = 'ok' | 'warning' | 'over'

export interface BudgetProgress {
  id: string
  categoryId: string
  categoryName: string
  budgetAmount: string
  spent: string
  percentage: number
  status: BudgetStatus
}

// The only place these thresholds are defined; F12 also drives the dashboard's budget
// widget (Phase 6), which imports getBudgetProgress rather than redefining them.
const WARNING_THRESHOLD = 70
const OVER_THRESHOLD = 100

function statusFor(percentage: number): BudgetStatus {
  if (percentage > OVER_THRESHOLD) return 'over'
  if (percentage >= WARNING_THRESHOLD) return 'warning'
  return 'ok'
}

/**
 * Per-category budget progress for one user/month/year: each budget row paired with the SQL
 * sum of that category's expense transactions in the same month/year. percentage is a derived
 * UI-only number (plain JS division is fine, it is not itself a monetary amount).
 */
export async function getBudgetProgress(userId: string, month: number, year: number): Promise<BudgetProgress[]> {
  const rows = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      budgetAmount: budgets.amount,
      spent: sum(transactions.amount),
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .leftJoin(
      transactions,
      and(
        eq(transactions.categoryId, budgets.categoryId),
        eq(transactions.userId, budgets.userId),
        eq(transactions.type, 'expense'),
        sql`extract(month from ${transactions.transactionDate}) = ${month}`,
        sql`extract(year from ${transactions.transactionDate}) = ${year}`
      )
    )
    .where(and(eq(budgets.userId, userId), eq(budgets.month, month), eq(budgets.year, year)))
    .groupBy(budgets.id, budgets.categoryId, categories.name, budgets.amount)

  return rows.map((row) => {
    const spent = row.spent ?? '0'
    const percentage = (Number(spent) / Number(row.budgetAmount)) * 100
    return {
      id: row.id,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      budgetAmount: row.budgetAmount,
      spent,
      percentage,
      status: statusFor(percentage),
    }
  })
}
