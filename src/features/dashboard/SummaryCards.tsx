import { TrendingDown, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AMOUNT_SIZE_CLASSES, AMOUNT_TONE_CLASSES, type AmountTone } from '@/lib/amount-style'
import { cn } from '@/lib/utils'
import CountUp from '@/components/react-bits/CountUp'

interface SummaryCardsProps {
  totalIncome: string | undefined
  totalExpense: string | undefined
  balance: string | undefined
  isLoading: boolean
}

interface CardSpec {
  label: string
  value: string
  icon: LucideIcon
  tone: AmountTone
}

export function SummaryCards({ totalIncome, totalExpense, balance, isLoading }: SummaryCardsProps) {
  if (isLoading && totalIncome === undefined) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const isNegativeBalance = Number(balance ?? '0') < 0
  const cards: CardSpec[] = [
    { label: 'Total income', value: totalIncome ?? '0', icon: TrendingUp, tone: 'income' },
    { label: 'Total expense', value: totalExpense ?? '0', icon: TrendingDown, tone: 'expense' },
    { label: 'Balance', value: balance ?? '0', icon: Wallet, tone: isNegativeBalance ? 'expense' : 'neutral' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <card.icon className="size-4" />
              {card.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* AmountDisplay itself always formats a static value, so the CountUp animation is
                composed by hand here, reusing its exact tone/size classes for a matching look. */}
            <CardTitle className={cn('tabular-nums', AMOUNT_TONE_CLASSES[card.tone], AMOUNT_SIZE_CLASSES.xl)}>
              Rp
              <CountUp to={Math.round(Number(card.value))} separator="." duration={0.8} />
            </CardTitle>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
