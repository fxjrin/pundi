import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeftRight, LayoutDashboard, MoreHorizontal, Wallet } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { api, ApiError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', end: false },
  { to: '/transactions', label: 'Transactions', end: false },
  { to: '/categories', label: 'Categories', end: false },
  { to: '/budgets', label: 'Budgets', end: false },
]

const ADMIN_NAV_LINKS = [
  { to: '/admin', label: 'Admin Dashboard', end: true },
  { to: '/admin/categories', label: 'Admin Categories', end: false },
]

// Direct, thumb-reachable tabs in the bottom bar. Categories and admin links live
// under "More" instead since a five-plus item row would not stay comfortably tappable.
const BOTTOM_TABS = [
  { to: '/dashboard', label: 'Dashboard', end: false, icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', end: false, icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', end: false, icon: Wallet },
]

const MORE_LINKS = [{ to: '/categories', label: 'Categories', end: false }]

const bottomTabClass =
  'flex flex-1 flex-col items-center justify-center gap-0.5 pb-[env(safe-area-inset-bottom)] text-xs text-muted-foreground'

// Top nav row on md+ screens; below md the same routes are reachable via the
// fixed bottom tab bar (Dashboard, Transactions, Budgets, More).
export function AppShell() {
  const { user, clearUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navLinks = user?.role === 'admin' ? [...NAV_LINKS, ...ADMIN_NAV_LINKS] : NAV_LINKS
  const moreLinks = user?.role === 'admin' ? [...MORE_LINKS, ...ADMIN_NAV_LINKS] : MORE_LINKS
  const isMoreActive = moreLinks.some((link) =>
    link.end ? location.pathname === link.to : location.pathname.startsWith(link.to)
  )

  async function handleLogout() {
    try {
      await api.post('/api/auth/logout')
    } catch (err) {
      if (!(err instanceof ApiError)) toast.error('Logout request failed, signing out locally anyway')
    } finally {
      clearUser()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Pundi</span>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground',
                    isActive && 'bg-muted text-foreground'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="max-w-24 truncate text-sm text-muted-foreground sm:max-w-none">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:inline-flex">
            Log out
          </Button>
        </div>
      </header>
      <main className="p-4 pb-[calc(1rem+var(--bottom-nav-height))] md:pb-4">
        <Outlet />
      </main>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex h-(--bottom-nav-height) items-stretch border-t border-border bg-background md:hidden"
      >
        {BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => cn(bottomTabClass, isActive && 'font-medium text-foreground')}
            >
              <Icon className="size-5" />
              {tab.label}
            </NavLink>
          )
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More"
              className={cn(bottomTabClass, isMoreActive && 'font-medium text-foreground')}
            >
              <MoreHorizontal className="size-5" />
              More
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={8} className="min-w-40">
            {moreLinks.map((link) => (
              <DropdownMenuItem key={link.to} asChild>
                <NavLink to={link.to} end={link.end} className="w-full">
                  {link.label}
                </NavLink>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  )
}
