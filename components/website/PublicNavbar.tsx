"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, X, ChevronDown } from "lucide-react"
import SmartSearch from "./SmartSearch"

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Noticias", href: "/noticias" },
  {
    label: "Competencias",
    children: [
      { label: "Calendario", href: "/calendario" },
      { label: "Posiciones", href: "/posiciones" },
      { label: "Estadísticas", href: "/estadisticas" },
    ],
  },
  { label: "Institucional", href: "/institucional" },
  { label: "Clubes", href: "/clubes" },
  { label: "Selecciones", href: "/selecciones" },
  { label: "Reglamentos", href: "/reglamentos" },
  { label: "Contacto", href: "/contacto" },
]

export default function PublicNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

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

          {/* Search + Mobile toggle */}
          <div className="flex items-center gap-1">
            <SmartSearch />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:bg-white/10"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
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
          </nav>
        </div>
      )}
    </header>
  )
}
