import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm [--card-spacing:--spacing(5)]">
        <CardHeader className="gap-2">
          <CardTitle className="text-xl">Sign in to Pundi</CardTitle>
          <CardDescription>Track your money, one transaction at a time.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            No account yet?{' '}
            <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
