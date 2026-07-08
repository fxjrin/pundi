import { z } from 'zod'
import { and, eq, gte, lt, sql, sum } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { transactions, categories } from '../../db/schema.js'
import { json, errorJson } from '../_lib/response.js'
import { requireUser } from '../_lib/auth.js'
import { getBudgetProgress } from '../_lib/budget-progress.js'

const summaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
})

// Number of months shown in the trend chart, counting backward from the requested month.
const TREND_MONTH_COUNT = 6

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

// month/year here are plain calendar integers (1-12, four-digit year), not JS Dates, so this
// arithmetic stays in integer month-index space and only turns into a date string at the end.
function shiftMonth(month: number, year: number, delta: number): { month: number; year: number } {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

function monthStartDate(period: { month: number; year: number }): string {
  return `${period.year}-${pad2(period.month)}-01`
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const params = Object.fromEntries(new URL(request.url).searchParams)
  const parsed = summaryQuerySchema.safeParse(params)
  if (!parsed.success) return errorJson('Invalid query', 400, parsed.error.flatten())

  const now = new Date()
  const month = parsed.data.month ?? now.getMonth() + 1
  const year = parsed.data.year ?? now.getFullYear()

  const trendMonths = Array.from({ length: TREND_MONTH_COUNT }, (_, i) =>
    shiftMonth(month, year, i - (TREND_MONTH_COUNT - 1))
  )
  const trendRangeStart = monthStartDate(trendMonths[0])
  const trendRangeEnd = monthStartDate(shiftMonth(month, year, 1))

  const monthExpr = sql`extract(month from ${transactions.transactionDate})`
  const yearExpr = sql`extract(year from ${transactions.transactionDate})`

  const [[totals], categoryBreakdownRows, budgetProgress, trendRows] = await Promise.all([
    // Balance is computed by Postgres in the same query as the two totals, never by
    // subtracting the two amount strings in JS.
    db
      .select({
        totalIncome: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'income'), 0)`,
        totalExpense: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'expense'), 0)`,
        balance: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'income'), 0) - coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'expense'), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, auth.id),
          sql`${monthExpr} = ${month}`,
          sql`${yearExpr} = ${year}`
        )
      ),
    db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, auth.id),
          eq(transactions.type, 'expense'),
          sql`${monthExpr} = ${month}`,
          sql`${yearExpr} = ${year}`
        )
      )
      .groupBy(categories.id, categories.name),
    getBudgetProgress(auth.id, month, year),
    db
      .select({
        month: sql<number>`${monthExpr}::int`,
        year: sql<number>`${yearExpr}::int`,
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, auth.id),
          gte(transactions.transactionDate, trendRangeStart),
          lt(transactions.transactionDate, trendRangeEnd)
        )
      )
      .groupBy(monthExpr, yearExpr, transactions.type),
  ])

  // Sorted for the pie chart (largest slice first); this is a display-order comparison, not a
  // monetary calculation, so a plain Number() comparator is fine.
  const categoryBreakdown = categoryBreakdownRows
    .map((row) => ({ categoryId: row.categoryId, categoryName: row.categoryName, total: row.total ?? '0' }))
    .sort((a, b) => Number(b.total) - Number(a.total))

  const monthlyTrend = trendMonths.map((period) => {
    const income = trendRows.find((row) => row.month === period.month && row.year === period.year && row.type === 'income')
    const expense = trendRows.find((row) => row.month === period.month && row.year === period.year && row.type === 'expense')
    return {
      month: period.month,
      year: period.year,
      income: income?.total ?? '0',
      expense: expense?.total ?? '0',
    }
  })

  return json({
    month,
    year,
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    balance: totals.balance,
    categoryBreakdown,
    budgetProgress,
    monthlyTrend,
  })
}
