"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Navbar from "@/components/layout/Navbar"
import { createClient } from "@/utils/supabase/client"
import type { TipoRol } from "@prisma/client"

interface UserData {
  nombre: string
  apellido: string
  roles: { rol: TipoRol }[]
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/me")
        if (res.ok) {
          const data = await res.json()
          setUserData(data.usuario)
          setUnreadCount(data.unreadNotifications || 0)

          const roles = data.usuario.roles.map((r: { rol: TipoRol }) => r.rol)
          if (
            roles.includes("SUPER_ADMIN") ||
            roles.includes("INSTRUCTOR")
          ) {
            setAuthorized(true)
          } else {
            setAuthorized(false)
            router.push("/oficiales")
          }
        } else {
          router.push("/oficiales/login")
        }
      } catch {
        router.push("/oficiales/login")
      }
    }
    loadUser()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/oficiales/login")
    router.refresh()
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!authorized) return null

  const roles = userData?.roles.map((r) => r.rol) ?? []

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar roles={roles} onLogout={handleLogout} />

      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
        <div className={`fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl transition-transform duration-200 ease-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <Sidebar roles={roles} onLogout={handleLogout} mobile onNavigate={() => setMenuOpen(false)} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar
          userName={userData ? `${userData.nombre} ${userData.apellido}` : "..."}
          unreadCount={unreadCount}
          onMenuToggle={() => setMenuOpen(!menuOpen)}
          menuOpen={menuOpen}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
