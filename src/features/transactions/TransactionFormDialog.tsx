import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { z } from 'zod'
import { createTransactionSchema, type CreateTransactionInput } from '@shared/schemas/transaction'

// react-hook-form's generic needs the schema's *input* shape (source optional, pre-default),
// while handleSubmit's callback receives the resolver's *output* shape (source defaulted in) --
// required whenever a Zod schema uses .default() on a field also driven by a form input.
type TransactionFormValues = z.input<typeof createTransactionSchema>
import { useCategories } from '@/features/categories/use-categories'
import { useCreateTransaction, useUpdateTransaction } from './use-transaction-mutations'
import type { Transaction } from './use-transactions'
import { ApiError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

interface TransactionFormDialogProps {
  /** Editing an existing transaction; omit for create mode. */
  transaction?: Transaction
  /** Pre-fill values (e.g. from an AI receipt scan) without switching to edit mode. */
  defaultValues?: Partial<CreateTransactionInput>
  trigger?: ReactNode
  /** Controlled open state, for a flow (like AI scan review) that opens this dialog itself. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TransactionFormDialog({
  transaction,
  defaultValues,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TransactionFormDialogProps) {
  // Falls back to owning its own open state when the parent doesn't pass open/onOpenChange
  // (e.g. the plain "Add transaction" trigger), so the dialog still closes itself after a
  // successful submit either way.
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = setControlledOpen ?? setInternalOpen

  const isEdit = !!transaction
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const isPending = createTransaction.isPending || updateTransaction.isPending

  const form = useForm<TransactionFormValues, unknown, CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          categoryId: transaction.category.id,
          amount: transaction.amount,
          note: transaction.note ?? '',
          transactionDate: transaction.transactionDate,
          source: transaction.source,
        }
      : {
          type: 'expense',
          categoryId: '',
          amount: '',
          note: '',
          transactionDate: todayIso(),
          source: 'manual',
          ...defaultValues,
        },
  })

  const type = form.watch('type')
  const { data: categories } = useCategories(type)

  // AI-scan review flow feeds a fresh defaultValues object into an already-mounted dialog
  // (see Phase 8); re-sync the form whenever that happens rather than only on first mount.
  useEffect(() => {
    if (defaultValues && !isEdit) form.reset({ ...form.getValues(), ...defaultValues })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues])

  async function onSubmit(values: CreateTransactionInput) {
    try {
      if (isEdit) {
        await updateTransaction.mutateAsync({ id: transaction.id, input: values })
        toast.success('Transaction updated')
      } else {
        await createTransaction.mutateAsync(values)
        toast.success('Transaction added')
        form.reset({
          type: values.type,
          categoryId: '',
          amount: '',
          note: '',
          transactionDate: values.transactionDate,
          source: 'manual',
        })
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit transaction' : 'Add transaction'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue('categoryId', '')
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="What was this for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Add transaction'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
