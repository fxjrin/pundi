import { useQuery } from '@tanstack/react-query'
import { Users, ArrowLeftRight, Tags, type LucideIcon } from 'lucide-react'
import { api } from '@/lib/api-client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminStats {
  totalUsers: number
  totalTransactions: number
  totalCategoriesGlobal: number
}

// Same icon + label header, tabular-nums value pattern as the user-facing SummaryCards,
// so admin stat cards read as the same component family rather than a one-off table.
const STATS: { key: keyof AdminStats; label: string; icon: LucideIcon }[] = [
  { key: 'totalUsers', label: 'Total users', icon: Users },
  { key: 'totalTransactions', label: 'Total transactions', icon: ArrowLeftRight },
  { key: 'totalCategoriesGlobal', label: 'Active global categories', icon: Tags },
]

function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<AdminStats>('/api/admin/stats'),
  })
}

export function AdminStatsCards() {
  const { data, isLoading } = useAdminStats()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STATS.map(({ key, label, icon: Icon }) => (
        <Card key={key}>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Icon className="size-4" />
              {label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <CardTitle className="text-2xl font-semibold tabular-nums">{data[key]}</CardTitle>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
