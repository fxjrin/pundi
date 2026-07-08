import { useState } from 'react'
import type { CreateTransactionInput } from '@shared/schemas/transaction'
import { useTransactions, type TransactionFilters as Filters } from '@/features/transactions/use-transactions'
import { TransactionFilters } from '@/features/transactions/TransactionFilters'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { TransactionFormDialog } from '@/features/transactions/TransactionFormDialog'
import { ReceiptScanButton } from '@/features/receipts/ReceiptScanButton'
import type { ScanReceiptResult } from '@/features/receipts/use-scan-receipt'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'

// Only carries over fields the AI actually determined -- an undetermined field is left out
// so the dialog's own defaults (e.g. today's date, empty amount) apply instead of a bad guess.
function scanResultToDefaults(result: ScanReceiptResult): Partial<CreateTransactionInput> {
  return {
    type: 'expense',
    source: 'ai_scan',
    ...(result.suggestedCategoryId ? { categoryId: result.suggestedCategoryId } : {}),
    ...(result.totalAmount !== null ? { amount: result.totalAmount.toFixed(2) } : {}),
    ...(result.date ? { transactionDate: result.date } : {}),
  }
}

// Only the filter fields the export endpoint understands; page/limit do not apply to a
// full unpaginated export, so they are left out of the query string.
function buildExportUrl(filters: Filters): string {
  const params = new URLSearchParams()
  const { type, categoryId, dateFrom, dateTo } = filters
  for (const [key, value] of Object.entries({ type, categoryId, dateFrom, dateTo })) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return `/api/transactions/export?${params.toString()}`
}

export function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 })
  const { data, isLoading } = useTransactions(filters)

  const [scanOpen, setScanOpen] = useState(false)
  const [scanDefaults, setScanDefaults] = useState<Partial<CreateTransactionInput>>()

  function handleScanned(result: ScanReceiptResult) {
    setScanDefaults(scanResultToDefaults(result))
    setScanOpen(true)
  }

  return (
    <div className="mx-auto max-w-4xl pb-24 md:pb-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.assign(buildExportUrl(filters))}>
            <Download /> Export CSV
          </Button>
          <div className="hidden items-center gap-2 md:flex">
            <ReceiptScanButton onScanned={handleScanned} />
            <TransactionFormDialog
              trigger={
                <Button size="sm">
                  <Plus /> Add transaction
                </Button>
              }
            />
          </div>
          <TransactionFormDialog open={scanOpen} onOpenChange={setScanOpen} defaultValues={scanDefaults} />
        </div>
      </div>
      <div className="mb-4">
        <TransactionFilters filters={filters} onChange={setFilters} />
      </div>
      <TransactionTable
        result={data}
        isLoading={isLoading}
        page={filters.page ?? 1}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      {/* Thumb-reachable mobile actions: primary Add-transaction FAB plus the scan
          entry point, floating above the bottom tab bar instead of scrolling with content. */}
      <div className="fixed right-4 bottom-[calc(var(--bottom-nav-height)+1rem)] z-30 flex items-center gap-2 md:hidden">
        <ReceiptScanButton onScanned={handleScanned} variant="fab" />
        <TransactionFormDialog
          trigger={
            <Button size="icon-lg" className="size-14 rounded-full shadow-lg" aria-label="Add transaction">
              <Plus className="size-6" />
            </Button>
          }
        />
      </div>
    </div>
  )
}
