import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/context/auth-context'
import { RequireAuth, RequireAdmin, RedirectIfAuthed } from '@/components/layout/require-auth'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route element={<RedirectIfAuthed />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
              </Route>
            </Route>

            <Route element={<RequireAdmin />}>
              <Route element={<AppShell />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
