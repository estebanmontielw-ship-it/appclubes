"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import {
  Home, User, CreditCard, FileText, Bell, LogOut,
  GraduationCap, Users, History, FolderOpen, Lock,
  Menu, X, Calendar, BarChart3,
} from "lucide-react"
import CTWhatsNewModal from "@/components/layout/CTWhatsNewModal"

const navItems = [
  { label: "Inicio", href: "/cuerpotecnico", icon: Home },
  { label: "Mi perfil", href: "/cuerpotecnico/perfil", icon: User },
  { label: "Mi carnet", href: "/cuerpotecnico/carnet", icon: CreditCard },
  { label: "Recursos", href: "/cuerpotecnico/recursos", icon: FileText },
  { label: "Notificaciones", href: "/cuerpotecnico/notificaciones", icon: Bell },
]

const comingSoon = [
  { label: "Cursos CPB", icon: GraduationCap, desc: "Cursos de capacitación oficial de la CPB. Formación continua para entrenadores y staff técnico." },
  { label: "Mis equipos", icon: Users, desc: "Visualizá a qué club estás vinculado y el staff de tu equipo." },
  { label: "Historial", icon: History, desc: "Consultá tus habilitaciones de temporadas anteriores." },
  { label: "Documentos", icon: FolderOpen, desc: "Visualizá y actualizá los documentos que subiste." },
]

export default function CTLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ct, setCt] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [comingSoonMsg, setComingSoonMsg] = useState<{ label: string; desc: string } | null>(null)

  useEffect(() => {
    fetch("/api/ct/me")
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setCt(data.ct); setUnread(data.unreadNotifications || 0) })
      .catch(() => router.push("/cuerpotecnico/login"))
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/cuerpotecnico/login")
    router.refresh()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Cargando...</div></div>
  }
  if (!ct) return null

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={mobile ? "flex flex-col w-full h-full bg-white" : "hidden md:flex md:flex-col md:w-60 md:min-h-screen bg-white border-r border-gray-100"}>
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/cuerpotecnico" className="flex items-center gap-3">
          <img src="/favicon-cpb.png" alt="CPB" className="h-9 w-9 object-contain" />
          <div>
            <p className="font-bold text-sm text-gray-900">CPB</p>
            <p className="text-[11px] text-gray-400">Cuerpo Técnico</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-3 mb-1.5">MI CUENTA</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => mobile && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}>
              <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/cuerpotecnico/notificaciones" && unread > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white text-primary" : "bg-primary text-white"}`}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )
        })}

        <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-3 mb-1.5 mt-5">COMPETENCIAS</p>
        <Link
          href="/cuerpotecnico/calendario-macro"
          onClick={() => mobile && setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname === "/cuerpotecnico/calendario-macro" ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Calendar className={`h-[18px] w-[18px] shrink-0 ${pathname === "/cuerpotecnico/calendario-macro" ? "text-white" : "text-gray-400"}`} />
          <span className="flex-1">Calendario Macro</span>
        </Link>
        {(ct.rol === "ENTRENADOR_NACIONAL" || ct.rol === "ENTRENADOR_EXTRANJERO" || ct.rol === "ASISTENTE") && (
          <Link
            href="/cuerpotecnico/estadisticas"
            onClick={() => mobile && setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/cuerpotecnico/estadisticas" ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BarChart3 className={`h-[18px] w-[18px] shrink-0 ${pathname === "/cuerpotecnico/estadisticas" ? "text-white" : "text-gray-400"}`} />
            <span className="flex-1">Estadísticas LNB</span>
          </Link>
        )}

        <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-3 mb-1.5 mt-5">PRÓXIMAMENTE</p>
        {comingSoon.map((item) => (
          <button key={item.label} onClick={() => setComingSoonMsg(item)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50">
            <item.icon className="h-[18px] w-[18px] shrink-0 text-gray-300" />
            <span className="flex-1 text-left">{item.label}</span>
            <Lock className="h-3.5 w-3.5 text-gray-300" />
          </button>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarContent />

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div className={`fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <SidebarContent mobile />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <Menu className="h-5 w-5" />
            </button>
            <div className="md:hidden">
              <img src="/favicon-cpb.png" alt="CPB" className="h-8 w-8 object-contain" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:block">{ct.nombre} {ct.apellido}</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {ct.fotoCarnetUrl ? (
                <img src={ct.fotoCarnetUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      <CTWhatsNewModal rol={ct.rol} />

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
            <button onClick={() => setComingSoonMsg(null)}
              className="w-full mt-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
