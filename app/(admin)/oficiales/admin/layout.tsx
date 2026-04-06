"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Navbar from "@/components/layout/Navbar"
import { createClient } from "@/utils/supabase/client"
import type { TipoRol } from "@prisma/client"
import AdminChatWidget from "@/components/layout/AdminChatWidget"
import { useNotifications } from "@/hooks/useNotifications"

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
  const [pendingUsers, setPendingUsers] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)
  const [pendingCT, setPendingCT] = useState(0)
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  // Real-time polling for notifications + pending badges (every 30s)
  const {
    unreadCount: polledUnreadCount,
    pendingUsers: polledPendingUsers,
    pendingPayments: polledPendingPayments,
    pendingCT: polledPendingCT,
  } = useNotifications({ enabled: authorized === true })

  // Sync polled values to state
  useEffect(() => {
    if (!authorized) return
    setUnreadCount(polledUnreadCount)
    setPendingUsers(polledPendingUsers)
    setPendingPayments(polledPendingPayments)
    setPendingCT(polledPendingCT)
  }, [polledUnreadCount, polledPendingUsers, polledPendingPayments, polledPendingCT, authorized])

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/me")
        if (res.ok) {
          const data = await res.json()
          setUserData(data.usuario)
          setUnreadCount(data.unreadNotifications || 0)
          setPendingUsers(data.pendingUsers || 0)
          setPendingPayments(data.pendingPayments || 0)
          setPendingCT(data.pendingCT || 0)

          const roles = data.usuario.roles.map((r: { rol: TipoRol }) => r.rol)
          if (roles.includes("SUPER_ADMIN") || roles.includes("INSTRUCTOR") || roles.includes("VERIFICADOR")) {
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
      <Suspense fallback={null}>
        <Sidebar
          roles={roles}
          onLogout={handleLogout}
          pendingUsers={pendingUsers}
          pendingPayments={pendingPayments}
          pendingCT={pendingCT}
          unreadNotifications={unreadCount}
        />
      </Suspense>

      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
        <div
          className={`fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Suspense fallback={null}>
            <Sidebar
              roles={roles}
              onLogout={handleLogout}
              mobile
              onNavigate={() => setMenuOpen(false)}
              pendingUsers={pendingUsers}
              pendingPayments={pendingPayments}
              pendingCT={pendingCT}
              unreadNotifications={unreadCount}
            />
          </Suspense>
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
      <AdminChatWidget />
    </div>
  )
}
