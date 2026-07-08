import { useState } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { AmountDisplay } from '@/components/shared/amount-display'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ApiError } from '@/lib/api-client'
import { useDeleteTransaction } from './use-transaction-mutations'
import { TransactionFormDialog } from './TransactionFormDialog'
import type { Transaction, TransactionListResponse } from './use-transactions'
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react'

interface TransactionTableProps {
  result: TransactionListResponse | undefined
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const [editOpen, setEditOpen] = useState(false)
  const deleteTransaction = useDeleteTransaction()

  async function handleDelete() {
    try {
      await deleteTransaction.mutateAsync(transaction.id)
      toast.success('Transaction deleted')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return (
    <TableRow>
      <TableCell>{transaction.transactionDate}</TableCell>
      <TableCell>{transaction.category.name}</TableCell>
      <TableCell className="max-w-40 truncate text-muted-foreground">{transaction.note}</TableCell>
      <TableCell>
        {transaction.source === 'ai_scan' && (
          <Badge variant="outline" className="text-xs">
            AI scan
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <AmountDisplay
          value={transaction.amount}
          tone={transaction.type === 'income' ? 'income' : 'expense'}
          size="sm"
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <TransactionFormDialog
            transaction={transaction}
            open={editOpen}
            onOpenChange={setEditOpen}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Edit">
                <Pencil />
              </Button>
            }
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Delete">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}

// Card-per-row layout for narrow screens -- same edit/delete actions as TransactionRow, kept
// separate rather than shared since the two only overlap by a handful of lines (table cells vs
// a card layout need different markup around the same mutation calls).
function TransactionCard({ transaction }: { transaction: Transaction }) {
  const [editOpen, setEditOpen] = useState(false)
  const deleteTransaction = useDeleteTransaction()

  async function handleDelete() {
    try {
      await deleteTransaction.mutateAsync(transaction.id)
      toast.success('Transaction deleted')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return (
    <Card size="sm" className="flex-row items-center justify-between gap-3 px-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{transaction.category.name}</span>
          {transaction.source === 'ai_scan' && (
            <Badge variant="outline" className="text-xs">
              AI scan
            </Badge>
          )}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {transaction.note ? `${transaction.transactionDate} - ${transaction.note}` : transaction.transactionDate}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <AmountDisplay
          value={transaction.amount}
          tone={transaction.type === 'income' ? 'income' : 'expense'}
          size="lg"
        />
        <div className="flex gap-1">
          <TransactionFormDialog
            transaction={transaction}
            open={editOpen}
            onOpenChange={setEditOpen}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Edit">
                <Pencil />
              </Button>
            }
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Delete">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  )
}

export function TransactionTable({ result, isLoading, page, onPageChange }: TransactionTableProps) {
  if (isLoading && !result) {
    return (
      <>
        <div className="flex flex-col gap-2 md:hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <div className="hidden flex-col gap-2 md:flex">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </>
    )
  }

  if (!result || result.data.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions found"
        description="Try adjusting your filters, or add a new transaction to get started."
        action={
          <TransactionFormDialog
            trigger={
              <Button size="sm">
                <Plus /> Add transaction
              </Button>
            }
          />
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 md:hidden">
        {result.data.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </TableBody>
        </Table>
      </div>

      {result.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {result.pagination.page} of {result.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= result.pagination.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
