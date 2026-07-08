import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/money'
import type { MonthlyTrendEntry } from './use-dashboard-summary'

// Fixed 2-arbitrary day so toLocaleString only reads the month name; never stored or compared.
const MONTH_ABBR = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleString('en-US', { month: 'short' }))

// Same good/critical pair as the app's validated status palette: income reads as the positive
// flow, expense as the negative one, same two hues in both light and dark mode.
const INCOME_COLOR = '#0ca30c'
const EXPENSE_COLOR = '#d03b3b'

const AXIS_TICK = { fontSize: 12, fill: 'var(--muted-foreground)' }
const TOOLTIP_STYLE = { background: 'var(--card)', borderColor: 'var(--border)', borderRadius: 8, fontSize: 12 }
const NEUTRAL_INK = { color: 'var(--foreground)' }

function formatCompactIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendEntry[] | undefined
  isLoading: boolean
}

export function MonthlyTrendChart({ data, isLoading }: MonthlyTrendChartProps) {
  const chartData = data?.map((entry) => ({
    label: `${MONTH_ABBR[entry.month - 1]} ${entry.year}`,
    income: Number(entry.income),
    expense: Number(entry.expense),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs expense (6 months)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && !chartData ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} tickFormatter={formatCompactIDR} />
              <Tooltip formatter={(value) => formatIDR(Number(value))} contentStyle={TOOLTIP_STYLE} itemStyle={NEUTRAL_INK} labelStyle={NEUTRAL_INK} />
              <Legend formatter={(value) => <span style={NEUTRAL_INK}>{value}</span>} />
              <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
