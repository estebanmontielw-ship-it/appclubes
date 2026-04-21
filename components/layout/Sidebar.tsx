"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home, User, CreditCard, BookOpen, FileText,
  Calendar, Bell, LogOut, Users, GraduationCap,
  Trophy, FolderOpen, ChevronDown, Banknote,
  DollarSign, BarChart3, Lock, X, Globe, Bot, Search, Zap, Camera, ClipboardList, Calculator, Palette,
} from "lucide-react"
import type { TipoRol } from "@prisma/client"

// ─── TIPOS ───────────────────────────────────────────────

interface NavSubItem {
  label: string
  href: string
  badge?: number
}

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  badge?: number
  subItems?: NavSubItem[]
  comingSoon?: string // description for coming soon modal
}

interface NavSection {
  label?: string
  items: NavItem[]
}

// ─── CONFIGURACIÓN DE NAVEGACIÓN ─────────────────────────

function getNavSections(
  roles: TipoRol[],
  badges: { pendientesUsuarios: number; pendientesPagos: number; pendientesCT: number }
): NavSection[] {
  const isSuperAdmin = roles.includes("SUPER_ADMIN")
  const isInstructor = roles.includes("INSTRUCTOR")
  const isVerificador = roles.includes("VERIFICADOR")
  const isDesignador = roles.includes("DESIGNADOR")

  if (isSuperAdmin) {
    return [
      {
        label: "MI CUENTA",
        items: [
          { label: "Dashboard", href: "/oficiales/admin", icon: Home },
          { label: "Mi perfil", href: "/oficiales/perfil", icon: User },
          { label: "Mi carnet", href: "/oficiales/carnet", icon: CreditCard },
        ],
      },
      {
        label: "USUARIOS",
        items: [
          {
            label: "Oficiales",
            icon: Users,
            subItems: [
              { label: "Dashboard", href: "/oficiales/admin/usuarios/dashboard" },
              { label: "Todos", href: "/oficiales/admin/usuarios" },
              { label: "Pendientes", href: "/oficiales/admin/usuarios?estado=PENDIENTE", badge: badges.pendientesUsuarios },
              { label: "Honorarios", href: "/oficiales/admin/honorarios-propios" },
            ],
          },
          {
            label: "Cuerpo Técnico",
            icon: Users,
            subItems: [
              { label: "Dashboard", href: "/oficiales/admin/cuerpotecnico/dashboard" },
              { label: "Todos", href: "/oficiales/admin/cuerpotecnico" },
              { label: "Pendientes", href: "/oficiales/admin/cuerpotecnico?estado=PENDIENTE", badge: badges.pendientesCT },
            ],
          },
        ],
      },
      {
        label: "CURSOS",
        items: [
          {
            label: "Cursos",
            icon: GraduationCap,
            subItems: [
              { label: "Gestionar cursos", href: "/oficiales/admin/cursos" },
              { label: "Pagos pendientes", href: "/oficiales/admin/pagos", badge: badges.pendientesPagos },
              { label: "Finanzas cursos", href: "/oficiales/admin/finanzas-cursos" },
            ],
          },
        ],
      },
      {
        label: "DESIGNACIONES",
        items: [
          {
            label: "Designaciones",
            icon: ClipboardList,
            subItems: [
              { label: "Planillas CPB", href: "/oficiales/admin/designaciones" },
              { label: "Calculadora Aranceles", href: "/oficiales/admin/aranceles-lnb" },
            ],
          },
        ],
      },
      {
        label: "PARTIDOS",
        items: [
          {
            label: "Partidos",
            icon: Trophy,
            subItems: [
              { label: "Programar partido", href: "/oficiales/admin/partidos" },
              { label: "Finanzas oficiales", href: "/oficiales/admin/finanzas" },
            ],
          },
          {
            label: "Torneo 3x3",
            href: "/oficiales/admin/torneo3x3",
            icon: Trophy,
          },
          {
            label: "Calendario Macro",
            href: "/oficiales/admin/calendario-macro",
            icon: Calendar,
          },
          {
            label: "Diseño / Flyers",
            href: "/oficiales/admin/diseno",
            icon: Palette,
          },
        ],
      },
      {
        label: "CONTENIDO",
        items: [
          {
            label: "Contenido",
            icon: FolderOpen,
            subItems: [
              { label: "Recursos gratuitos", href: "/oficiales/admin/recursos" },
              { label: "Enviar notificación", href: "/oficiales/admin/notificaciones" },
            ],
          },
        ],
      },
      {
        label: "SITIO WEB",
        items: [
          {
            label: "Sitio Web",
            icon: Globe,
            subItems: [
              { label: "Fotos del Inicio", href: "/oficiales/admin/website/hero" },
              { label: "Noticias", href: "/oficiales/admin/website/noticias" },
              { label: "Clubes", href: "/oficiales/admin/website/clubes" },
              { label: "Selecciones", href: "/oficiales/admin/website/selecciones" },
              { label: "Reglamentos", href: "/oficiales/admin/website/reglamentos" },
              { label: "Páginas", href: "/oficiales/admin/website/paginas" },
              { label: "Mensajes", href: "/oficiales/admin/website/contacto" },
            ],
          },
        ],
      },
      {
        label: "DATOS EN VIVO",
        items: [
          { label: "Genius Sports", href: "/oficiales/admin/genius-sports", icon: Zap },
          { label: "Curator Test", href: "/oficiales/admin/curator-test", icon: Camera },
        ],
      },
      {
        label: "REPORTES",
        items: [
          { label: "Estadísticas", href: "/oficiales/admin/estadisticas", icon: BarChart3 },
        ],
      },
      {
        label: "ASISTENTE IA",
        items: [
          { label: "CPB Bot", href: "/oficiales/admin/asistente", icon: Bot },
        ],
      },
    ]
  }

  if (isVerificador) {
    return [
      {
        label: "MI CUENTA",
        items: [
          { label: "Inicio", href: "/oficiales", icon: Home },
          { label: "Mi perfil", href: "/oficiales/perfil", icon: User },
          { label: "Mi carnet", href: "/oficiales/carnet", icon: CreditCard },
        ],
      },
      {
        label: "VERIFICACIÓN",
        items: [
          {
            label: "Oficiales",
            icon: Users,
            subItems: [
              { label: "Dashboard", href: "/oficiales/admin/usuarios/dashboard" },
              { label: "Todos", href: "/oficiales/admin/usuarios" },
              { label: "Pendientes", href: "/oficiales/admin/usuarios?estado=PENDIENTE", badge: badges.pendientesUsuarios },
            ],
          },
        ],
      },
      {
        label: "COMPETENCIAS",
        items: [
          { label: "Calendario Macro", href: "/oficiales/admin/calendario-macro", icon: Calendar },
        ],
      },
    ]
  }

  if (isDesignador) {
    return [
      {
        label: "MI CUENTA",
        items: [
          { label: "Dashboard", href: "/oficiales/admin", icon: Home },
        ],
      },
      {
        label: "DESIGNACIONES",
        items: [
          {
            label: "Designaciones",
            icon: ClipboardList,
            subItems: [
              { label: "Planillas CPB", href: "/oficiales/admin/designaciones" },
              { label: "Calculadora Aranceles", href: "/oficiales/admin/aranceles-lnb" },
            ],
          },
        ],
      },
      {
        label: "CALENDARIO",
        items: [
          { label: "Calendario Macro", href: "/oficiales/admin/calendario-macro", icon: Calendar },
        ],
      },
    ]
  }

  if (isInstructor) {
    return [
      {
        label: "MI CUENTA",
        items: [
          { label: "Inicio", href: "/oficiales", icon: Home },
          { label: "Mi perfil", href: "/oficiales/perfil", icon: User },
        ],
      },
      {
        label: "MIS CURSOS",
        items: [
          {
            label: "Cursos",
            icon: GraduationCap,
            subItems: [
              { label: "Ver mis cursos", href: "/oficiales/admin/cursos" },
            ],
          },
        ],
      },
      {
        label: "COMPETENCIAS",
        items: [
          { label: "Calendario Macro", href: "/oficiales/admin/calendario-macro", icon: Calendar },
        ],
      },
    ]
  }

  // Oficial (ARBITRO / MESA / ESTADISTICO)
  return [
    {
      label: "MI CUENTA",
      items: [
        { label: "Inicio", href: "/oficiales", icon: Home },
        { label: "Mi perfil", href: "/oficiales/perfil", icon: User },
        { label: "Mi carnet", href: "/oficiales/carnet", icon: CreditCard },
      ],
    },
    {
      label: "FORMACIÓN",
      items: [
        { label: "Mis cursos", href: "/oficiales/cursos", icon: BookOpen, comingSoon: "Acá vas a poder inscribirte a cursos de capacitación oficial de la CPB, con módulos interactivos, exámenes y certificados." },
        { label: "Recursos", href: "/oficiales/recursos", icon: FileText, comingSoon: "Acá vas a encontrar reglamentos FIBA, manuales, videos instructivos y material de estudio gratuito para tu formación como oficial." },
      ],
    },
    {
      label: "ACTIVIDAD",
      items: [
        { label: "Mis partidos", href: "/oficiales/mis-partidos", icon: Calendar },
        { label: "Mis honorarios", href: "/oficiales/mis-honorarios", icon: Banknote },
        { label: "Calculadora", href: "/oficiales/calculadora", icon: Calculator },
      ],
    },
    {
      label: "CONSULTAS",
      items: [
        { label: "Verificar CT", href: "/oficiales/verificar-ct", icon: Search },
      ],
    },
    {
      label: "COMPETENCIAS",
      items: [
        { label: "Calendario Macro", href: "/oficiales/calendario-macro", icon: Calendar },
      ],
    },
  ]
}

// ─── ITEM CON SUBMENÚ ────────────────────────────────────

function NavItemConSub({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const searchParams = useSearchParams()
  const currentSearch = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const isActiveParent = item.subItems?.some((s) => pathname.startsWith(s.href.split("?")[0]))
  const [open, setOpen] = useState(isActiveParent ?? false)
  const totalBadge = item.subItems?.reduce((acc, s) => acc + (s.badge ?? 0), 0) ?? 0

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
          isActiveParent
            ? "bg-primary/10 text-primary"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {totalBadge > 0 && !open && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {totalBadge}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-gray-400",
            open ? "rotate-180" : ""
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-4 mt-1 border-l-2 border-gray-100 pl-3 space-y-0.5">
          {item.subItems?.map((sub) => {
            const subPath = sub.href.split("?")[0]
            const subQuery = sub.href.includes("?") ? sub.href.split("?")[1] : null
            const isActive = subQuery
              ? pathname === subPath && currentSearch.includes(subQuery)
              : pathname === subPath && !currentSearch.includes("estado=")
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all duration-150",
                  isActive
                    ? "bg-primary text-white font-medium shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <span>{sub.label}</span>
                {sub.badge && sub.badge > 0 ? (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                      isActive ? "bg-white text-primary" : "bg-red-500 text-white"
                    )}
                  >
                    {sub.badge > 99 ? "99+" : sub.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── SIDEBAR PRINCIPAL ───────────────────────────────────

interface SidebarProps {
  roles: TipoRol[]
  onLogout: () => void
  mobile?: boolean
  onNavigate?: () => void
  pendingUsers?: number
  pendingPayments?: number
  pendingCT?: number
  unreadNotifications?: number
}

export default function Sidebar({
  roles,
  onLogout,
  mobile = false,
  onNavigate,
  pendingUsers = 0,
  pendingPayments = 0,
  pendingCT = 0,
  unreadNotifications = 0,
}: SidebarProps) {
  const pathname = usePathname()
  const [comingSoonMsg, setComingSoonMsg] = useState<{ label: string; desc: string } | null>(null)

  const sections = getNavSections(roles, {
    pendientesUsuarios: pendingUsers,
    pendientesPagos: pendingPayments,
    pendientesCT: pendingCT,
  })

  return (
    <aside
      className={
        mobile
          ? "flex flex-col w-full h-full bg-white"
          : "hidden md:flex md:flex-col md:w-60 md:min-h-screen bg-white border-r border-gray-100"
      }
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href={roles.includes("SUPER_ADMIN") ? "/oficiales/admin" : "/oficiales"} className="flex items-center gap-3">
          <img src="/logo-cpb.jpg" alt="CPB" className="h-9 w-9 object-contain" />
          <div>
            <p className="font-bold text-sm text-gray-900">CPB Oficiales</p>
            <p className="text-[11px] text-gray-400">Portal oficial</p>
          </div>
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-3 mb-1.5">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                if (item.subItems) {
                  return (
                    <NavItemConSub
                      key={item.label}
                      item={item}
                      pathname={pathname}
                      onNavigate={onNavigate}
                    />
                  )
                }

                const isActive =
                  pathname === item.href ||
                  (item.href !== "/oficiales" &&
                    item.href !== "/oficiales/admin" &&
                    pathname.startsWith(item.href + "/"))

                if (item.comingSoon) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => setComingSoonMsg({ label: item.label, desc: item.comingSoon! })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 transition-all duration-150"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0 text-gray-300" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <Lock className="h-3.5 w-3.5 text-gray-300" />
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-white" : "text-gray-400")} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                          isActive ? "bg-white text-primary" : "bg-red-500 text-white"
                        )}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — Site link + Notificaciones + Logout */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-150"
        >
          <Globe className="h-[18px] w-[18px] shrink-0 text-gray-400" />
          <span>Volver al sitio CPB</span>
        </Link>
        <Link
          href="/oficiales/notificaciones"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
            pathname === "/oficiales/notificaciones"
              ? "bg-primary text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Bell className={cn("h-[18px] w-[18px] shrink-0", pathname === "/oficiales/notificaciones" ? "text-white" : "text-gray-400")} />
          <span className="flex-1">Notificaciones</span>
          {unreadNotifications > 0 && (
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                pathname === "/oficiales/notificaciones" ? "bg-white text-primary" : "bg-red-500 text-white"
              )}
            >
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </Link>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Coming soon modal */}
      {comingSoonMsg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setComingSoonMsg(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setComingSoonMsg(null)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100">
              <X className="h-4 w-4 text-gray-400" />
            </button>
            <div className="text-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg">{comingSoonMsg.label}</h3>
              <p className="text-xs text-primary font-semibold uppercase tracking-wide mt-1">Próximamente</p>
            </div>
            <p className="text-sm text-gray-600 text-center leading-relaxed">{comingSoonMsg.desc}</p>
            <button
              onClick={() => setComingSoonMsg(null)}
              className="w-full mt-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
