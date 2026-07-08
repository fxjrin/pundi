export type AmountTone = 'income' | 'expense' | 'neutral'
export type AmountSize = 'sm' | 'md' | 'lg' | 'xl'

// Same green/red pair already validated in SummaryCards and MonthlyTrendChart, reused here so
// every money amount across the app (cards, charts, list rows) shares one income/expense read.
// Kept in a plain module (not amount-display.tsx) so a caller that cannot use the AmountDisplay
// span itself (e.g. wrapping an animated count-up) can still apply the exact same classes
// without exporting a non-component value out of a component file.
export const AMOUNT_TONE_CLASSES: Record<AmountTone, string> = {
  income: 'text-emerald-600 dark:text-emerald-500',
  expense: 'text-red-600 dark:text-red-500',
  neutral: 'text-foreground',
}

export const AMOUNT_SIZE_CLASSES: Record<AmountSize, string> = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-xl font-semibold',
  xl: 'text-3xl font-bold',
}
