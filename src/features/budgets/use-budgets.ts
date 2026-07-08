import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { UpsertBudgetInput } from '@shared/schemas/budget'

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

export interface Budget {
  id: string
  userId: string
  categoryId: string
  month: number
  year: number
  amount: string
  createdAt: string
}

export interface BudgetListResponse {
  data: BudgetProgress[]
  month: number
  year: number
}

export function useBudgets(month: number, year: number) {
  return useQuery({
    queryKey: ['budgets', month, year],
    queryFn: () => api.get<BudgetListResponse>(`/api/budgets?month=${month}&year=${year}`),
  })
}

export function useUpsertBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertBudgetInput) => api.post<{ budget: Budget }>('/api/budgets', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/budgets?id=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
