import { json, errorJson } from '../_lib/response.js'
import { requireUser } from '../_lib/auth.js'
import { scanReceiptRequestSchema } from '../../shared/schemas/receipt.js'
import { scanReceiptImage } from '../_lib/gemini.js'
import { getExpenseCategoryOptions, matchCategoryId } from '../_lib/category-match.js'

// Never writes to the database -- this endpoint only returns a suggestion for the client
// to review in the transaction form; saving happens through the normal POST /api/transactions
// path once the user explicitly confirms.
export async function POST(request: Request): Promise<Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const body = await request.json().catch(() => null)
  const parsed = scanReceiptRequestSchema.safeParse(body)
  if (!parsed.success) return errorJson('Invalid input', 400, parsed.error.flatten())

  const categoryOptions = await getExpenseCategoryOptions(auth.id)
  const extraction = await scanReceiptImage(
    parsed.data.imageBase64,
    parsed.data.mimeType,
    categoryOptions.map((option) => option.name)
  )
  const suggestedCategoryId = matchCategoryId(categoryOptions, extraction.category)

  return json({
    merchantName: extraction.merchantName,
    date: extraction.date,
    totalAmount: extraction.totalAmount,
    suggestedCategory: extraction.category,
    suggestedCategoryId,
    partial: extraction.partial,
    warning: extraction.warning,
  })
}
