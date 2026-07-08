import { useAuth } from '@/hooks/use-auth'
import { AdminStatsCards } from '@/features/admin/AdminStatsCards'

export function AdminDashboardPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin: {user?.name}</h1>
        <p className="text-sm text-muted-foreground">
          Aggregate stats only -- no per-user financial detail is shown here.
        </p>
      </div>
      <AdminStatsCards />
    </div>
  )
}
