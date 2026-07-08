import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp, Trash2 } from 'lucide-react'
import { useCategories, useDeleteCategory, type Category } from './use-categories'
import { ApiError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'

// Same income/expense icon language as SummaryCards, so the empty state for a type
// reads consistently with how that type is represented everywhere else in the app.
const SECTION_CONFIG: Record<Category['type'], { label: string; icon: LucideIcon; emptyDescription: string }> = {
  income: {
    label: 'Income',
    icon: TrendingUp,
    emptyDescription: 'Add an income category to start grouping money coming in.',
  },
  expense: {
    label: 'Expense',
    icon: TrendingDown,
    emptyDescription: 'Add an expense category to start grouping your spending.',
  },
}

function CategoryRow({ category }: { category: Category }) {
  const deleteCategory = useDeleteCategory()

  async function handleDelete() {
    try {
      await deleteCategory.mutateAsync(category.id)
      toast.success('Category deleted')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return (
    <Card size="sm" className="flex-row flex-wrap items-center justify-between gap-2 px-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="max-w-48 truncate font-medium">{category.name}</span>
        <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>{category.type}</Badge>
        {category.isDefault && <Badge variant="outline">Default</Badge>}
      </div>
      {!category.isDefault && (
        // icon-lg over icon-sm: a delete action needs a comfortable tap target on mobile,
        // not just the smallest size that visually fits.
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={handleDelete}
          disabled={deleteCategory.isPending}
          aria-label={`Delete ${category.name}`}
          className="shrink-0"
        >
          <Trash2 />
        </Button>
      )}
    </Card>
  )
}

function CategorySection({ type, categories }: { type: Category['type']; categories: Category[] }) {
  const { label, icon, emptyDescription } = SECTION_CONFIG[type]

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
      {categories.length === 0 ? (
        <EmptyState icon={icon} title={`No ${type} categories yet`} description={emptyDescription} />
      ) : (
        categories.map((category) => <CategoryRow key={category.id} category={category} />)
      )}
    </div>
  )
}

export function CategoryList() {
  const { data: categories, isLoading } = useCategories()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {[0, 1].map((section) => (
          <div key={section} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  // Grouped by type rather than one mixed list: each type keeps its own default seed
  // category, so an empty section is rare, but still needs its own friendly prompt
  // when it happens (e.g. an admin deactivating the last default of that type).
  const income = (categories ?? []).filter((category) => category.type === 'income')
  const expense = (categories ?? []).filter((category) => category.type === 'expense')

  return (
    <div className="flex flex-col gap-6">
      <CategorySection type="income" categories={income} />
      <CategorySection type="expense" categories={expense} />
    </div>
  )
}
