import { useState } from 'react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { AmountDisplay } from '@/components/shared/amount-display'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useDeleteBudget, type BudgetProgress } from './use-budgets'
import { BudgetFormDialog } from './BudgetFormDialog'
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react'

// Same 70% / 100% thresholds as api/_lib/budget-progress.ts; only the color mapping lives
// here, the status itself is computed server-side. Exported so the dashboard's
// BudgetProgressList can reuse the exact same status colors.
export const STATUS_BAR_CLASS: Record<BudgetProgress['status'], string> = {
  ok: '[&>[data-slot=progress-indicator]]:bg-emerald-500',
  warning: '[&>[data-slot=progress-indicator]]:bg-amber-500',
  over: '[&>[data-slot=progress-indicator]]:bg-red-500',
}

interface BudgetRowProps {
  progress: BudgetProgress
  month: number
  year: number
}

function BudgetRow({ progress, month, year }: BudgetRowProps) {
  const [editOpen, setEditOpen] = useState(false)
  const deleteBudget = useDeleteBudget()

  async function handleDelete() {
    try {
      await deleteBudget.mutateAsync(progress.id)
      toast.success('Budget deleted')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return (
    <Card size="sm" className="px-4">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 truncate font-medium">{progress.categoryName}</span>
        <div className="flex shrink-0 items-center gap-1">
          <BudgetFormDialog
            budget={{ categoryId: progress.categoryId, amount: progress.budgetAmount, month, year }}
            periodDefaults={{ month, year }}
            open={editOpen}
            onOpenChange={setEditOpen}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Edit">
                <Pencil />
              </Button>
            }
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Delete">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this budget?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <AmountDisplay value={progress.budgetAmount} size="lg" />
        <span className="shrink-0 text-sm text-muted-foreground">{Math.round(progress.percentage)}%</span>
      </div>
      <Progress
        value={Math.min(progress.percentage, 100)}
        className={cn('h-2.5', STATUS_BAR_CLASS[progress.status])}
      />
      <div className="text-sm text-muted-foreground">
        <AmountDisplay value={progress.spent} size="sm" className="text-muted-foreground" /> spent
      </div>
    </Card>
  )
}

interface BudgetListProps {
  data: BudgetProgress[] | undefined
  isLoading: boolean
  month: number
  year: number
}

export function BudgetList({ data, isLoading, month, year }: BudgetListProps) {
  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No budgets yet"
        description="Set a monthly limit per category to see how much you have left to spend."
        action={
          <BudgetFormDialog
            periodDefaults={{ month, year }}
            trigger={
              <Button size="sm">
                <Plus /> Set budget
              </Button>
            }
          />
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((progress) => (
        <BudgetRow key={progress.id} progress={progress} month={month} year={year} />
      ))}
    </div>
  )
}
