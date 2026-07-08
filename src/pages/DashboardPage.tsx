import { useState } from 'react'
import { Plus, Receipt } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useDashboardSummary } from '@/features/dashboard/use-dashboard-summary'
import { SummaryCards } from '@/features/dashboard/SummaryCards'
import { CategoryPieChart } from '@/features/dashboard/CategoryPieChart'
import { MonthlyTrendChart } from '@/features/dashboard/MonthlyTrendChart'
import { BudgetProgressList } from '@/features/dashboard/BudgetProgressList'
import { TransactionFormDialog } from '@/features/transactions/TransactionFormDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'

// Fixed 2-arbitrary day so toLocaleString only reads the month name; never stored or compared.
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleString('en-US', { month: 'long' }))

function currentPeriod() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function DashboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState(currentPeriod)
  const { data, isLoading } = useDashboardSummary(period.month, period.year)
  const years = Array.from({ length: 5 }, (_, i) => period.year - 2 + i)

  // Amounts must be > 0 at creation (see createTransactionSchema), so both totals landing on
  // exactly "0" for a loaded period means there is truly nothing recorded for it, not just a
  // coincidental zero sum -- the trend chart and budget list stay visible regardless, since
  // they carry information (past months, already-set budgets) that is not scoped to this check.
  const isEmptyPeriod = data !== undefined && Number(data.totalIncome) === 0 && Number(data.totalExpense) === 0

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
          <p className="text-sm text-muted-foreground">Here is how your money moved this month.</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(period.month)} onValueChange={(value) => setPeriod({ ...period, month: Number(value) })}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, index) => (
                <SelectItem key={name} value={String(index + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(period.year)} onValueChange={(value) => setPeriod({ ...period, year: Number(value) })}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEmptyPeriod ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description={`No income or expenses recorded for ${MONTH_NAMES[period.month - 1]} ${period.year}. Add your first transaction to see totals here.`}
          action={
            <TransactionFormDialog
              trigger={
                <Button size="sm">
                  <Plus /> Add transaction
                </Button>
              }
            />
          }
        />
      ) : (
        <SummaryCards totalIncome={data?.totalIncome} totalExpense={data?.totalExpense} balance={data?.balance} isLoading={isLoading} />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryPieChart data={data?.categoryBreakdown} isLoading={isLoading} />
        <MonthlyTrendChart data={data?.monthlyTrend} isLoading={isLoading} />
      </div>

      <BudgetProgressList data={data?.budgetProgress} isLoading={isLoading} />
    </div>
  )
}
