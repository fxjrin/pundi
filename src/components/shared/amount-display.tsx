import type { ComponentProps } from 'react'
import { formatIDR } from '@/lib/money'
import { cn } from '@/lib/utils'
import { AMOUNT_SIZE_CLASSES, AMOUNT_TONE_CLASSES, type AmountSize, type AmountTone } from '@/lib/amount-style'

export type { AmountTone, AmountSize }

interface AmountDisplayProps extends Omit<ComponentProps<'span'>, 'children'> {
  value: string | number
  tone?: AmountTone
  size?: AmountSize
}

export function AmountDisplay({ value, tone = 'neutral', size = 'md', className, ...props }: AmountDisplayProps) {
  return (
    <span
      data-slot="amount-display"
      className={cn('tabular-nums', AMOUNT_TONE_CLASSES[tone], AMOUNT_SIZE_CLASSES[size], className)}
      {...props}
    >
      {formatIDR(value)}
    </span>
  )
}
