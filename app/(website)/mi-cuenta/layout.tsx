"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { LayoutDashboard, User, Bell, LogOut, Loader2 } from "lucide-react"

const NAV = [
  { href: "/mi-cuenta", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/mi-cuenta/perfil", icon: User, label: "Mi perfil" },
  { href: "/mi-cuenta/notificaciones", icon: Bell, label: "Notificaciones" },
]

interface Profile { nombre: string; apellido: string; avatarUrl?: string | null }

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      fetch("/api/me/preferencias")
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.profile) setProfile(d.profile) })
        .finally(() => setLoading(false))
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const initials = profile ? `${profile.nombre[0]}${profile.apellido[0]}`.toUpperCase() : "?"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Sidebar — desktop */}
          <aside className="hidden md:flex flex-col w-56 shrink-0 gap-2">
            {/* Avatar card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 mb-2">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{initials}</span>
                </div>
              )}
              {profile && (
                <div className="text-center">
                  <p className="font-semibold text-sm text-gray-900">{profile.nombre} {profile.apellido}</p>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Aficionado</span>
                </div>
              )}
            </div>

            {/* Nav links */}
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {NAV.map(({ href, icon: Icon, label }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0",
                      active ? "text-primary bg-primary/5" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Cerrar sesión
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile tabs */}
            <div className="md:hidden mb-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-x-auto">
                {NAV.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors whitespace-nowrap px-2",
                        active ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-900"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
