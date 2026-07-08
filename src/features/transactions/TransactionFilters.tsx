import { useCategories } from '@/features/categories/use-categories'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TransactionFilters as Filters } from './use-transactions'

const ALL = 'all'

interface TransactionFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const { data: categories } = useCategories()

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Select
        value={filters.type ?? ALL}
        onValueChange={(value) =>
          onChange({ ...filters, type: value === ALL ? undefined : (value as 'income' | 'expense'), page: 1 })
        }
      >
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="income">Income</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId ?? ALL}
        onValueChange={(value) => onChange({ ...filters, categoryId: value === ALL ? undefined : value, page: 1 })}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="w-full sm:w-40"
        value={filters.dateFrom ?? ''}
        onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined, page: 1 })}
      />
      <Input
        type="date"
        className="w-full sm:w-40"
        value={filters.dateTo ?? ''}
        onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined, page: 1 })}
      />
    </div>
  )
}
