import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { ScanReceiptRequest } from '@shared/schemas/receipt'

export interface ScanReceiptResult {
  merchantName: string | null
  date: string | null
  totalAmount: number | null
  suggestedCategory: string | null
  suggestedCategoryId: string | null
  partial: boolean
  warning?: string
}

export function useScanReceipt() {
  return useMutation({
    mutationFn: (input: ScanReceiptRequest) => api.post<ScanReceiptResult>('/api/receipts/scan', input),
  })
}
