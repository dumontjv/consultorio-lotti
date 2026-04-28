'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  DollarSign,
  BookOpen,
  Video,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BarChart2,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserRole } from '@/types/database'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'medica', 'psicologa', 'secretaria'],
  },
  {
    href: '/pacientes',
    label: 'Pacientes',
    icon: Users,
    roles: ['admin', 'medica', 'psicologa', 'secretaria'],
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: Calendar,
    roles: ['admin', 'medica', 'psicologa', 'secretaria'],
  },
  {
    href: '/documentos',
    label: 'Documentos',
    icon: FileText,
    roles: ['admin', 'medica', 'psicologa', 'secretaria'],
  },
  {
    href: '/financeiro',
    label: 'Financeiro',
    icon: DollarSign,
    roles: ['admin', 'medica', 'psicologa', 'secretaria'],
  },
  {
    href: '/relatorios',
    label: 'Relatórios',
    icon: BarChart2,
    roles: ['admin', 'medica', 'psicologa', 'secretaria'],
  },
  {
    href: '/cid',
    label: 'CID',
    icon: BookOpen,
    roles: ['admin', 'medica', 'psicologa'],
  },
  {
    href: '/teleconsulta',
    label: 'Teleconsulta',
    icon: Video,
    roles: ['admin', 'medica', 'psicologa'],
  },
  {
    href: '/profissionais',
    label: 'Profissionais',
    icon: Stethoscope,
    roles: ['admin'],
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
    roles: ['admin'],
  },
]

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  medica: 'Médica',
  psicologa: 'Psicóloga',
  secretaria: 'Secretária',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-slate-100 text-slate-700',
  medica: 'bg-teal-50 text-teal-700',
  psicologa: 'bg-indigo-50 text-indigo-700',
  secretaria: 'bg-amber-50 text-amber-700',
}

const ROLE_LOGO: Record<UserRole, string> = {
  admin: '/logos/logo-consultorio.svg',
  medica: '/logos/logo-medica.svg',
  psicologa: '/logos/logo-psicologa.svg',
  secretaria: '/logos/logo-consultorio.svg',
}

interface SidebarProps {
  userRole: UserRole
  userName: string
  userEmail: string
  userFotoUrl?: string | null
}

export function Sidebar({ userRole, userName, userEmail, userFotoUrl }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [saindo, setSaindo] = useState(false)

  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  async function handleLogout() {
    setSaindo(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Erro ao sair. Tente novamente.')
      setSaindo(false)
    }
  }

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  function NavContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-slate-100">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <div className="flex items-center gap-3">
              <Image
                src={ROLE_LOGO[userRole]}
                alt="Logo"
                width={36}
                height={36}
                className="shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">Lotti Fonseca</p>
                <p className="text-xs text-slate-400 truncate">Consultório</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? userRole === 'medica'
                      ? 'bg-teal-50 text-teal-700'
                      : userRole === 'psicologa'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                ) : isActive ? (
                  <ChevronRight className="h-3 w-3 opacity-50" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div className="px-3 py-3 border-t border-slate-100">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={userFotoUrl ?? undefined} alt={userName} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{userName}</p>
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-sm font-medium',
                    ROLE_COLORS[userRole]
                  )}
                >
                  {ROLE_LABELS[userRole]}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-400 truncate">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/configuracoes/perfil')}>
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={saindo}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {saindo ? 'Saindo...' : 'Sair'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 md:border-r md:border-slate-100 md:bg-white z-30">
        <NavContent />
      </aside>

      {/* Mobile: hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white z-40 md:hidden flex flex-col shadow-xl">
            <NavContent />
          </aside>
        </>
      )}
    </>
  )
}
