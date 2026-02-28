import { useState } from 'react'
import { Menu, LogOut, User, Sun, Moon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, Settings, Tag } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Despesas', path: '/expenses', icon: Receipt },
  { label: 'Categorias', path: '/categories', icon: Tag },
  { label: 'Configuracoes', path: '/settings', icon: Settings },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Header() {
  const { profile, signOut } = useAuth()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { resolvedTheme, setTheme } = useThemeStore()

  const initials = profile?.display_name ? getInitials(profile.display_name) : 'U'

  return (
    <header className="flex h-16 items-center border-b px-4 gap-4">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSheetOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium">
              {profile?.display_name ?? 'Usuario'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{profile?.display_name ?? 'Usuario'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2" asChild>
            <NavLink to="/settings">
              <User className="h-4 w-4" />
              Perfil
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-destructive" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile navigation sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="flex h-16 items-center border-b px-6">
            <SheetTitle className="text-xl font-bold tracking-tight">Cojunta</SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSheetOpen(false)}
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
        </SheetContent>
      </Sheet>
    </header>
  )
}
