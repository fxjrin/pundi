import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { CreateCategoryInput } from '@shared/schemas/category'

export interface Category {
  id: string
  userId: string | null
  name: string
  type: 'income' | 'expense'
  isDefault: boolean
  createdAt: string
}

export function useCategories(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: ['categories', type ?? 'all'],
    queryFn: () => api.get<{ data: Category[] }>(`/api/categories${type ? `?type=${type}` : ''}`),
    select: (res) => res.data,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => api.post<{ category: Category }>('/api/categories', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}
