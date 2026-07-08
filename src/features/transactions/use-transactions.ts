import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: string
  note: string | null
  transactionDate: string
  source: 'manual' | 'ai_scan'
  createdAt: string
  category: { id: string; name: string }
}

export interface TransactionFilters {
  page?: number
  limit?: number
  type?: 'income' | 'expense'
  categoryId?: string
  dateFrom?: string
  dateTo?: string
}

export interface TransactionListResponse {
  data: Transaction[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export function useTransactions(filters: TransactionFilters) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }

  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => api.get<TransactionListResponse>(`/api/transactions?${params.toString()}`),
    placeholderData: (previous) => previous,
  })
}
