import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterForm } from '@/features/auth/RegisterForm'

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm [--card-spacing:--spacing(5)]">
        <CardHeader className="gap-2">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Free, and takes less than a minute.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
