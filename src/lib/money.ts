// Display-only formatting. Never used for arithmetic -- amounts are summed server-side in SQL
// (see api/dashboard/summary.ts) so this single parse-then-format never accumulates float error.
export function formatIDR(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
