"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react"
import SmartSearch from "./SmartSearch"
import { createClient } from "@/utils/supabase/client"

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Noticias", href: "/noticias" },
  {
    label: "Competencias",
    children: [
      { label: "Calendario", href: "/calendario" },
      { label: "Posiciones", href: "/posiciones" },
      { label: "Líderes", href: "/lideres" },
      { label: "Estadísticas", href: "/estadisticas" },
      { label: "3x3", href: "/3x3" },
    ],
  },
  { label: "Institucional", href: "/institucional" },
  { label: "Clubes", href: "/clubes" },
  { label: "Selecciones", href: "/selecciones" },
  { label: "Reglamentos", href: "/reglamentos" },
  { label: "Contacto", href: "/contacto" },
]

type SessionState = "loading" | "logged_in" | "logged_out"
type UserInfo = { redirect: string; type: string } | null

export default function PublicNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [sessionState, setSessionState] = useState<SessionState>("loading")
  const [userInfo, setUserInfo] = useState<UserInfo>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/whoami")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled) return
        if (d) { setUserInfo(d); setSessionState("logged_in") }
        else { setSessionState("logged_out") }
      })
      .catch(() => { if (!cancelled) setSessionState("logged_out") })
    return () => { cancelled = true }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSessionState("logged_out")
    setUserInfo(null)
    setUserMenuOpen(false)
    router.push("/")
    router.refresh()
  }

  const portalLabel = userInfo?.type === "aficionado" ? "Mi cuenta" : "Mi portal"
  const portalHref = userInfo?.redirect || "/mi-cuenta"

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0a1628] to-[#132043] lg:bg-none lg:bg-white/95 backdrop-blur-md border-b border-white/10 lg:border-gray-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src="/favicon-cpb.png" alt="CPB" className="h-10 w-10 object-contain" />
            <div className="hidden sm:block">
              <p className="font-heading text-lg text-white lg:text-gray-900 leading-tight tracking-wide">CPB</p>
              <p className="text-[10px] text-blue-300 lg:text-gray-400 leading-tight -mt-0.5">Confederación Paraguaya de Básquetbol</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.children) {
                const isActive = link.children.some((c) => pathname === c.href)
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <button
                      className={cn(
                        "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive ? "text-primary bg-primary/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      {link.label}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    {dropdownOpen && (
                      <>
                        {/* Invisible bridge: fills the mt-1 gap so onMouseLeave doesn't fire */}
                        <div className="absolute top-full left-0 right-0 h-1" />
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "block px-4 py-2.5 text-sm transition-colors",
                              pathname === child.href
                                ? "text-primary bg-primary/5 font-medium"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                      </>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={link.href}
                  href={link.href!}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-primary bg-primary/5"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Search + Auth + Mobile toggle */}
          <div className="flex items-center gap-1">
            <SmartSearch />

            {/* Auth button — desktop */}
            {sessionState === "loading" ? (
              <div className="hidden lg:block h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : sessionState === "logged_out" ? (
              <Link
                href="/login"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
              >
                <User className="h-4 w-4" />
                Entrar
              </Link>
            ) : (
              <div className="hidden lg:block relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                >
                  <User className="h-4 w-4 text-primary" />
                  {portalLabel}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <Link href={portalHref} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <LayoutDashboard className="h-4 w-4" /> {portalLabel}
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="h-4 w-4" /> Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:bg-white/10"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — always rendered, toggled with max-h to avoid CLS */}
      <div
        className={`lg:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          mobileOpen ? "max-h-screen border-t border-gray-100 bg-white" : "max-h-0"
        }`}
        aria-hidden={!mobileOpen}
      >
        <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            if (link.children) {
              return (
                <div key={link.label}>
                  <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {link.label}
                  </p>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block px-3 py-2.5 rounded-lg text-sm font-medium pl-6",
                        pathname === child.href
                          ? "text-primary bg-primary/5"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )
            }

            return (
              <Link
                key={link.href}
                href={link.href!}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2.5 rounded-lg text-sm font-medium",
                  pathname === link.href
                    ? "text-primary bg-primary/5"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {link.label}
              </Link>
            )
          })}
          {/* Mobile auth */}
          <div className="pt-1 pb-2 border-t border-gray-100 mt-1">
            {sessionState === "logged_out" && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/5"
              >
                <User className="h-4 w-4" /> Entrar al portal
              </Link>
            )}
            {sessionState === "logged_in" && (
              <>
                <Link
                  href={portalHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <LayoutDashboard className="h-4 w-4" /> {portalLabel}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
