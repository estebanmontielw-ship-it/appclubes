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
}

export default function Sidebar({ roles, onLogout }: SidebarProps) {
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
    { href: "/oficiales/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/oficiales/admin/cursos", label: "Cursos", icon: BookOpen },
    { href: "/oficiales/admin/pagos", label: "Pagos", icon: DollarSign },
    { href: "/oficiales/admin/recursos", label: "Recursos", icon: FileText },
    { href: "/oficiales/admin/partidos", label: "Partidos", icon: Calendar },
    { href: "/oficiales/admin/finanzas", label: "Finanzas", icon: Wallet },
    { href: "/oficiales/admin/notificaciones", label: "Notificaciones", icon: Bell },
  ]

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:min-h-screen bg-white border-r">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/oficiales" className="flex items-center gap-2">
          <img src="/logo-cpb.jpg" alt="CPB" className="h-8 w-8 object-contain" />
          <span className="font-semibold text-lg">Oficiales</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Mi cuenta
        </p>
        {userLinks.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            icon={link.icon}
            label={link.label}
            active={pathname === link.href}
          />
        ))}

        {isAdmin && (
          <>
            <div className="my-4 border-t" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Administración
            </p>
            {adminLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                active={pathname === link.href}
              />
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-md w-full transition-colors"
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
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
