import { useState } from 'react'
import { useBudgets } from '@/features/budgets/use-budgets'
import { BudgetFormDialog } from '@/features/budgets/BudgetFormDialog'
import { BudgetList } from '@/features/budgets/BudgetList'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function currentPeriod() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function BudgetsPage() {
  const [period, setPeriod] = useState(currentPeriod)
  const { data, isLoading } = useBudgets(period.month, period.year)
  const years = Array.from({ length: 5 }, (_, i) => period.year - 2 + i)

  return (
    <div className="mx-auto max-w-2xl pb-24 md:pb-0">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <BudgetFormDialog
          periodDefaults={period}
          trigger={
            <Button size="sm" className="hidden md:inline-flex">
              <Plus /> Set budget
            </Button>
          }
        />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex">
        <Select value={String(period.month)} onValueChange={(value) => setPeriod({ ...period, month: Number(value) })}>
          <SelectTrigger className="w-full sm:w-36">
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
          <SelectTrigger className="w-full sm:w-24">
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
      <BudgetList data={data?.data} isLoading={isLoading} month={period.month} year={period.year} />
      <BudgetFormDialog
        periodDefaults={period}
        trigger={
          <Button
            size="icon-lg"
            className="fixed right-4 bottom-[calc(var(--bottom-nav-height)+1rem)] z-30 size-14 rounded-full shadow-lg md:hidden"
            aria-label="Set budget"
          >
            <Plus className="size-6" />
          </Button>
        }
      />
    </div>
  )
}
