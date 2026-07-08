import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { BudgetProgress } from '@/features/budgets/use-budgets'

export interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  total: string
}

export interface MonthlyTrendEntry {
  month: number
  year: number
  income: string
  expense: string
}

export interface DashboardSummary {
  month: number
  year: number
  totalIncome: string
  totalExpense: string
  balance: string
  categoryBreakdown: CategoryBreakdown[]
  budgetProgress: BudgetProgress[]
  monthlyTrend: MonthlyTrendEntry[]
}

export function useDashboardSummary(month: number, year: number) {
  return useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: () => api.get<DashboardSummary>(`/api/dashboard/summary?month=${month}&year=${year}`),
  })
}
