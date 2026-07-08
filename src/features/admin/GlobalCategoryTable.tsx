import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Tags } from 'lucide-react'
import { createCategorySchema, type CreateCategoryInput } from '@shared/schemas/category'
import type { Category } from '@/features/categories/use-categories'
import { api, ApiError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { EmptyState } from '@/components/shared/empty-state'

function useGlobalCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/admin/categories'),
    select: (res) => res.data,
  })
}

function useCreateGlobalCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => api.post<{ category: Category }>('/api/admin/categories', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })
}

function useToggleGlobalCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch<{ category: Category }>(`/api/admin/categories?id=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })
}

function NewGlobalCategoryForm() {
  const createCategory = useCreateGlobalCategory()

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: '', type: 'expense' },
  })

  async function onSubmit(values: CreateCategoryInput) {
    try {
      await createCategory.mutateAsync(values)
      toast.success('Global category added')
      form.reset()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="sm:flex-1">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full sm:w-32">
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
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding...' : 'Add category'}
        </Button>
      </form>
    </Form>
  )
}

// Shared by the desktop table row and the mobile card so the toggle mutation and its
// success/error toast only live in one place.
function useCategoryToggleHandler(category: Category) {
  const toggleCategory = useToggleGlobalCategory()

  async function handleToggle() {
    try {
      await toggleCategory.mutateAsync(category.id)
      toast.success(category.isDefault ? 'Category deactivated' : 'Category activated')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return { handleToggle, isPending: toggleCategory.isPending }
}

function CategoryRow({ category }: { category: Category }) {
  const { handleToggle, isPending } = useCategoryToggleHandler(category)

  return (
    <TableRow>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>
        <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>{category.type}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={category.isDefault ? 'outline' : 'secondary'}>
          {category.isDefault ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={handleToggle} disabled={isPending}>
          {category.isDefault ? 'Deactivate' : 'Activate'}
        </Button>
      </TableCell>
    </TableRow>
  )
}

// Mobile counterpart to CategoryRow, same shared Card idiom as the user-facing CategoryList
// (name + badges up top, action row below, for a comfortable tap target).
function CategoryCard({ category }: { category: Category }) {
  const { handleToggle, isPending } = useCategoryToggleHandler(category)

  return (
    <Card size="sm" className="px-4">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{category.name}</span>
        <Badge variant={category.isDefault ? 'outline' : 'secondary'}>
          {category.isDefault ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>{category.type}</Badge>
        <Button variant="outline" size="sm" onClick={handleToggle} disabled={isPending}>
          {category.isDefault ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  )
}

export function GlobalCategoryTable() {
  const { data: categories, isLoading } = useGlobalCategories()

  return (
    <div className="flex flex-col gap-6">
      <NewGlobalCategoryForm />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No global categories yet"
          description="Add one above to make it available to every new user by default."
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <CategoryRow key={category.id} category={category} />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-2 md:hidden">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
