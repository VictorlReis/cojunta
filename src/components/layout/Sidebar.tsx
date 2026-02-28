import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Despesas', path: '/expenses', icon: Receipt },
  { label: 'Configuracoes', path: '/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { profile, signOut } = useAuth()

  return (
    <div
      className={cn(
        'flex w-60 flex-col border-r bg-background',
        className,
      )}
    >
      {/* Branding */}
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-bold tracking-tight">Cojunta</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        <div className="mb-2 px-3 py-1">
          <p className="text-sm font-medium truncate">{profile?.display_name ?? 'Usuario'}</p>
          <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
