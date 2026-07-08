import { GlobalCategoryTable } from '@/features/admin/GlobalCategoryTable'

export function AdminCategoriesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Global categories</h1>
        <p className="text-sm text-muted-foreground">
          Default categories offered automatically to every new user.
        </p>
      </div>
      <GlobalCategoryTable />
    </div>
  )
}
