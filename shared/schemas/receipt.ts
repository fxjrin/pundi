import { z } from 'zod'

// Gemini's JSON output can omit fields or return null despite the responseSchema hint, so
// every field here is optional/nullable -- a missing field must surface as an empty value
// for the user to fill in themselves, never throw or get silently defaulted.
export const receiptExtractionSchema = z.object({
  merchant_name: z.string().nullish(),
  date: z.string().nullish(),
  total_amount: z.number().nullish(),
  category: z.string().nullish(),
})
export type ReceiptExtraction = z.infer<typeof receiptExtractionSchema>

export const scanReceiptRequestSchema = z.object({
  imageBase64: z.string().min(1, 'Image is required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})
export type ScanReceiptRequest = z.infer<typeof scanReceiptRequestSchema>
