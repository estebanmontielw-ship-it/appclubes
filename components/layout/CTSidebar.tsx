"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import {
  Home, User, CreditCard, FileText, Bell, LogOut,
  GraduationCap, Users, History, FolderOpen, Lock,
  Menu, X, ChevronRight,
} from "lucide-react"

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

interface CTLayoutProps {
  children: React.ReactNode
  ct: any
}

export default function CTSidebar({ ct, onLogout }: { ct: any; onLogout: () => void }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [comingSoonMsg, setComingSoonMsg] = useState<{ label: string; desc: string } | null>(null)

  const sidebar = (mobile = false) => (
    <aside className={mobile ? "flex flex-col w-full h-full bg-white" : "hidden md:flex md:flex-col md:w-60 md:min-h-screen bg-white border-r border-gray-100"}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/cuerpotecnico" className="flex items-center gap-3">
          <img src="/favicon-cpb.png" alt="CPB" className="h-9 w-9 object-contain" />
          <div>
            <p className="font-bold text-sm text-gray-900">CPB</p>
            <p className="text-[11px] text-gray-400">Cuerpo Técnico</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-3 mb-1.5">MI CUENTA</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-3 mb-1.5 mt-5">PRÓXIMAMENTE</p>
        {comingSoon.map((item) => (
          <button
            key={item.label}
            onClick={() => setComingSoonMsg({ label: item.label, desc: item.desc })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 transition-all duration-150"
          >
            <item.icon className="h-[18px] w-[18px] shrink-0 text-gray-300" />
            <span className="flex-1 text-left">{item.label}</span>
            <Lock className="h-3.5 w-3.5 text-gray-300" />
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-gray-100">
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

  return {
    sidebar,
    mobileOpen,
    setMobileOpen,
    mobileToggle: (
      <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    ),
  }
}
