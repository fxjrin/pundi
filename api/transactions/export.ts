import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../_lib/db.js'
import { transactions, categories } from '../../db/schema.js'
import { errorJson } from '../_lib/response.js'
import { requireUser } from '../_lib/auth.js'
import { transactionQuerySchema } from '../../shared/schemas/transaction.js'
import { buildCsv } from '../_lib/csv.js'

// Byte order mark built from its code point, not a literal character, so this source file
// stays plain ASCII; prepending it makes Excel read the CSV body as UTF-8 instead of guessing.
const UTF8_BOM = String.fromCharCode(0xfeff)

export async function GET(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const params = Object.fromEntries(new URL(request.url).searchParams)
  const parsed = transactionQuerySchema.safeParse(params)
  if (!parsed.success) return errorJson('Invalid query', 400, parsed.error.flatten())
  const { type, categoryId, dateFrom, dateTo } = parsed.data

  const where = and(
    eq(transactions.userId, auth.id),
    type ? eq(transactions.type, type) : undefined,
    categoryId ? eq(transactions.categoryId, categoryId) : undefined,
    dateFrom ? gte(transactions.transactionDate, dateFrom) : undefined,
    dateTo ? lte(transactions.transactionDate, dateTo) : undefined
  )

  const rows = await db
    .select({
      transactionDate: transactions.transactionDate,
      type: transactions.type,
      amount: transactions.amount,
      note: transactions.note,
      source: transactions.source,
      category: { name: categories.name },
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))

  const csv = buildCsv(rows, [
    { header: 'Date', value: (row) => row.transactionDate },
    { header: 'Type', value: (row) => row.type },
    { header: 'Category', value: (row) => row.category.name },
    { header: 'Amount', value: (row) => row.amount },
    { header: 'Note', value: (row) => row.note ?? '' },
    { header: 'Source', value: (row) => row.source },
  ])

  return new Response(UTF8_BOM + csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pundi-transactions.csv"',
    },
  })
}
