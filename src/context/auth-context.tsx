import { createContext, useCallback, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  refetch: () => Promise<unknown>
  setUser: (user: AuthUser) => void
  clearUser: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // The JWT lives in an httpOnly cookie, unreadable by JS, so "am I logged in" is
  // discovered by asking the server, not by inspecting any local token.
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      try {
        const res = await api.get<{ user: AuthUser }>('/api/profile')
        return res.user
      } catch {
        return null
      }
    },
    retry: false,
    staleTime: Infinity,
  })

  const setUser = useCallback(
    (user: AuthUser) => {
      queryClient.setQueryData(['auth', 'profile'], user)
    },
    [queryClient]
  )

  const clearUser = useCallback(() => {
    queryClient.setQueryData(['auth', 'profile'], null)
  }, [queryClient])

  const refetch = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] }),
    [queryClient]
  )

  return (
    <AuthContext.Provider value={{ user: data ?? null, isLoading, refetch, setUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  )
}
