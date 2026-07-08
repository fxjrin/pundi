import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { upsertBudgetSchema, type UpsertBudgetInput } from '@shared/schemas/budget'
import { useCategories } from '@/features/categories/use-categories'
import { useUpsertBudget } from './use-budgets'
import { ApiError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

interface EditBudgetValues {
  categoryId: string
  amount: string
  month: number
  year: number
}

interface BudgetFormDialogProps {
  /** Editing an existing budget; category/month/year are locked, only amount can change. */
  budget?: EditBudgetValues
  /** Prefill month/year for a new budget, matching the period currently shown on the page. */
  periodDefaults: { month: number; year: number }
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BudgetFormDialog({
  budget,
  periodDefaults,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: BudgetFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = setControlledOpen ?? setInternalOpen

  const isEdit = !!budget
  const upsertBudget = useUpsertBudget()
  const { data: categories } = useCategories('expense')

  const form = useForm<UpsertBudgetInput>({
    resolver: zodResolver(upsertBudgetSchema),
    defaultValues: budget
      ? { categoryId: budget.categoryId, month: budget.month, year: budget.year, amount: budget.amount }
      : { categoryId: '', month: periodDefaults.month, year: periodDefaults.year, amount: '' },
  })

  async function onSubmit(values: UpsertBudgetInput) {
    try {
      await upsertBudget.mutateAsync(values)
      toast.success(isEdit ? 'Budget updated' : 'Budget set')
      if (!isEdit) form.reset({ categoryId: '', month: values.month, year: values.year, amount: '' })
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
          <DialogTitle>{isEdit ? 'Edit budget' : 'Set budget'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEdit}>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value)}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTH_NAMES.map((name, index) => (
                          <SelectItem key={name} value={String(index + 1)}>
                            {name}
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
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isEdit}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget amount</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={upsertBudget.isPending}>
              {upsertBudget.isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Set budget'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
