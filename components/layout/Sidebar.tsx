"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  User,
  CreditCard,
  BookOpen,
  FileText,
  Bell,
  Users,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Calendar,
  Wallet,
} from "lucide-react"
import type { TipoRol } from "@prisma/client"

interface SidebarProps {
  roles: TipoRol[]
  onLogout: () => void
  mobile?: boolean
  onNavigate?: () => void
  pendingUsers?: number
}

export default function Sidebar({ roles, onLogout, mobile = false, onNavigate, pendingUsers = 0 }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = roles.includes("SUPER_ADMIN") || roles.includes("INSTRUCTOR")

  const userLinks = [
    { href: "/oficiales", label: "Inicio", icon: LayoutDashboard },
    { href: "/oficiales/perfil", label: "Mi perfil", icon: User },
    { href: "/oficiales/carnet", label: "Mi carnet", icon: CreditCard },
    { href: "/oficiales/cursos", label: "Cursos", icon: BookOpen },
    { href: "/oficiales/recursos", label: "Recursos", icon: FileText },
    { href: "/oficiales/mis-partidos", label: "Mis partidos", icon: Calendar },
    { href: "/oficiales/mis-honorarios", label: "Mis honorarios", icon: Wallet },
    { href: "/oficiales/notificaciones", label: "Notificaciones", icon: Bell },
  ]

  const adminLinks = [
    { href: "/oficiales/admin", label: "Dashboard Admin", icon: LayoutDashboard },
    { href: "/oficiales/admin/usuarios", label: "Usuarios", icon: Users, badge: pendingUsers },
    { href: "/oficiales/admin/cursos", label: "Cursos", icon: BookOpen },
    { href: "/oficiales/admin/pagos", label: "Pagos cursos", icon: DollarSign },
    { href: "/oficiales/admin/finanzas-cursos", label: "Finanzas cursos", icon: DollarSign },
    { href: "/oficiales/admin/recursos", label: "Recursos", icon: FileText },
    { href: "/oficiales/admin/partidos", label: "Partidos", icon: Calendar },
    { href: "/oficiales/admin/finanzas", label: "Finanzas oficiales", icon: Wallet },
    { href: "/oficiales/admin/notificaciones", label: "Notificaciones", icon: Bell },
  ]

  return (
    <aside className={mobile ? "flex flex-col w-full h-full bg-white" : "hidden md:flex md:flex-col md:w-64 md:min-h-screen bg-white border-r border-gray-100"}>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/oficiales" className="flex items-center gap-3">
          <img src="/logo-cpb.jpg" alt="CPB" className="h-9 w-9 object-contain" />
          <div>
            <span className="font-bold text-base text-gray-900">CPB Oficiales</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
          Mi cuenta
        </p>
        {userLinks.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            icon={link.icon}
            label={link.label}
            active={pathname === link.href}
            onClick={onNavigate}
          />
        ))}

        {isAdmin && (
          <>
            <div className="my-4 mx-3 border-t border-gray-100" />
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
              Administración
            </p>
            {adminLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                active={pathname === link.href}
                onClick={onNavigate}
                badge={(link as any).badge}
              />
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg w-full transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick?: () => void
  badge?: number
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150",
        active
          ? "bg-primary text-white font-medium shadow-sm"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-gray-400")} />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className={cn(
          "h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1",
          active ? "bg-white text-primary" : "bg-red-500 text-white"
        )}>
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  )
}
