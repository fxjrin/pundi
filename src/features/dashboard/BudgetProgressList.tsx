import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { AmountDisplay } from '@/components/shared/amount-display'
import { cn } from '@/lib/utils'
import { STATUS_BAR_CLASS } from '@/features/budgets/BudgetList'
import type { BudgetProgress } from '@/features/budgets/use-budgets'

interface BudgetProgressListProps {
  data: BudgetProgress[] | undefined
  isLoading: boolean
}

export function BudgetProgressList({ data, isLoading }: BudgetProgressListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading && !data ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No budgets set for this period yet.</p>
        ) : (
          data.map((progress) => (
            <div key={progress.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium">{progress.categoryName}</span>
                <span className="shrink-0 text-muted-foreground">{Math.round(progress.percentage)}%</span>
              </div>
              <Progress value={Math.min(progress.percentage, 100)} className={cn('h-2', STATUS_BAR_CLASS[progress.status])} />
              <span className="text-xs text-muted-foreground">
                <AmountDisplay value={progress.spent} size="sm" className="text-xs font-normal text-muted-foreground" />{' '}
                of{' '}
                <AmountDisplay
                  value={progress.budgetAmount}
                  size="sm"
                  className="text-xs font-normal text-muted-foreground"
                />
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
