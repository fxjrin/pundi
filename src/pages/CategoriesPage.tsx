import { CategoryList } from '@/features/categories/CategoryList'
import { CategoryFormDialog } from '@/features/categories/CategoryFormDialog'

export function CategoriesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <CategoryFormDialog />
      </div>
      <CategoryList />
    </div>
  )
}
