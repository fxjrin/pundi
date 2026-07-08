import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { registerSchema, type RegisterInput } from '@shared/schemas/auth'
import { api, ApiError } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import type { AuthUser } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export function RegisterForm() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  async function onSubmit(values: RegisterInput) {
    try {
      const res = await api.post<{ user: AuthUser }>('/api/auth/register', values)
      setUser(res.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong'
      toast.error(message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  placeholder="Your name"
                  className="h-11 px-3 py-2"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 px-3 py-2"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="h-11 px-3 py-2"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="mt-3 h-11 text-base">
          {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Form>
  )
}
