import { GoogleGenAI } from '@google/genai'
import { env } from './env.js'
import { receiptExtractionSchema } from '../../shared/schemas/receipt.js'

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

const EXPECTED_FIELDS = ['merchant_name', 'date', 'total_amount', 'category'] as const

export interface ReceiptScanResult {
  merchantName: string | null
  date: string | null
  totalAmount: number | null
  category: string | null
  partial: boolean
  warning?: string
}

const EMPTY_RESULT = { merchantName: null, date: null, totalAmount: null, category: null }

/**
 * Sends a receipt photo to Gemini and returns its best-effort structured extraction.
 * Never throws on malformed or incomplete AI output -- flags `partial`/`warning` instead,
 * since a silently-wrong amount is worse than an empty field the user fills in themselves.
 */
export async function scanReceiptImage(
  imageBase64: string,
  mimeType: string,
  categoryNames: string[]
): Promise<ReceiptScanResult> {
  // Naming an exact allowed list, rather than letting Gemini invent a free-text category,
  // is what makes matchCategoryId's lookup actually resolve to an id in practice -- an
  // unconstrained guess tends to come back in English (e.g. "Food") against this app's
  // Indonesian category names (e.g. "Makanan") and would never match.
  const categoryInstruction =
    categoryNames.length > 0
      ? `Suggest a spending category for this receipt, choosing the single best fit from exactly this list: ${categoryNames.join(', ')}. Respond with null if none of them fit reasonably well.`
      : 'Suggest a short spending category for this receipt.'

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [
      { text: `Extract merchant name, date (YYYY-MM-DD if determinable), and total amount from this receipt photo. ${categoryInstruction} Respond only with the requested JSON, using null for any field you cannot determine.` },
      { inlineData: { mimeType, data: imageBase64 } },
    ]}],
    config: {
      responseMimeType: 'application/json',
      responseSchema: { type: 'object', properties: { merchant_name: {type:'string'}, date: {type:'string'}, total_amount: {type:'number'}, category: {type:'string'} }, required: [] },
    },
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(response.text ?? '')
  } catch {
    return { ...EMPTY_RESULT, partial: true, warning: 'Could not read the AI response, please fill in the details manually' }
  }

  const result = receiptExtractionSchema.safeParse(parsed)
  if (!result.success) {
    return { ...EMPTY_RESULT, partial: true, warning: 'AI response was in an unexpected format, please fill in the details manually' }
  }

  const missing = EXPECTED_FIELDS.filter((field) => result.data[field] === null || result.data[field] === undefined)

  return {
    merchantName: result.data.merchant_name ?? null,
    date: result.data.date ?? null,
    totalAmount: result.data.total_amount ?? null,
    category: result.data.category ?? null,
    partial: missing.length > 0,
    warning: missing.length > 0 ? `Could not determine: ${missing.join(', ')}, please fill in manually` : undefined,
  }
}
