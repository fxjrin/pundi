import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/money'
import type { CategoryBreakdown } from './use-dashboard-summary'

// Fixed hue order matching the app's --chart-1..8 tokens (never cycled by category identity).
// This project's category count realistically stays well under 8 (seeded defaults plus
// whatever a user adds), so no "fold extra categories into Other" bucket is needed.
const SLICE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
]

const TOOLTIP_STYLE = { background: 'var(--card)', borderColor: 'var(--border)', borderRadius: 8, fontSize: 12 }
const NEUTRAL_INK = { color: 'var(--foreground)' }

interface CategoryPieChartProps {
  data: CategoryBreakdown[] | undefined
  isLoading: boolean
}

export function CategoryPieChart({ data, isLoading }: CategoryPieChartProps) {
  const chartData = data?.map((entry) => ({ ...entry, total: Number(entry.total) }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense by category</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && !chartData ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : !chartData || chartData.length === 0 ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No expenses recorded for this period yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <PieChart>
              <Pie data={chartData} dataKey="total" nameKey="categoryName" innerRadius={60} outerRadius={90} paddingAngle={2}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.categoryId} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatIDR(Number(value))} contentStyle={TOOLTIP_STYLE} itemStyle={NEUTRAL_INK} labelStyle={NEUTRAL_INK} />
              <Legend formatter={(value) => <span style={NEUTRAL_INK}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
