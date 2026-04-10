"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CreditCard, BookOpen, Bell, Users, DollarSign,
  AlertCircle, Search, X, Sparkles, Calendar, Clock,
  MapPin, ChevronRight, BellRing,
} from "lucide-react"
import { PageSkeleton } from "@/components/ui/skeleton"
import { ROL_LABELS } from "@/lib/constants"
import type { TipoRol, EstadoVerificacion } from "@prisma/client"
import PortalInstallPrompt from "@/components/PortalInstallPrompt"

interface PartidoProximo {
  id: string
  rol: string
  partido: {
    id: string
    fecha: string
    hora: string
    cancha: string | null
    equipoLocal: string
    equipoVisit: string
  }
}

const ROL_LABEL_CORTO: Record<string, string> = {
  ARBITRO_PRINCIPAL:    "Crew Chief",
  ARBITRO_ASISTENTE_1:  "Auxiliar 1",
  ARBITRO_ASISTENTE_2:  "Auxiliar 2",
  MESA_ANOTADOR:        "Apuntador",
  MESA_CRONOMETRADOR:   "Cronómetro",
  MESA_OPERADOR_24S:    "Lanzamiento 24s",
  MESA_ASISTENTE:       "Relator",
  ESTADISTICO:          "Estadístico",
}

interface DashboardData {
  usuario: {
    nombre: string
    apellido: string
    estadoVerificacion: EstadoVerificacion
    motivoRechazo: string | null
    roles: { rol: TipoRol }[]
  }
  unreadNotifications: number
}

const ANNOUNCEMENT_KEY = "cpb_seen_ct_search_v1"

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [partidos, setPartidos] = useState<PartidoProximo[]>([])
  const [pushStatus, setPushStatus] = useState<"unknown" | "granted" | "denied" | "default">("unknown")
  const [activandoPush, setActivandoPush] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)

  // Show announcement once
  useEffect(() => {
    if (!localStorage.getItem(ANNOUNCEMENT_KEY)) {
      setShowAnnouncement(true)
    }
  }, [])

  // Check push permission status
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(Notification.permission as any)
    }
  }, [])

  async function activarPush() {
    setActivandoPush(true)
    try {
      const { requestNotificationPermission } = await import("@/lib/firebase")
      const token = await requestNotificationPermission()
      if (token) {
        await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
      }
      if ("Notification" in window) {
        setPushStatus(Notification.permission as any)
      }
    } catch (err) {
      console.error("Push error:", err)
    } finally {
      setActivandoPush(false)
    }
  }

  const dismissAnnouncement = () => {
    setShowAnnouncement(false)
    localStorage.setItem(ANNOUNCEMENT_KEY, "true")
  }

  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not ok")
        return res.json()
      })
      .then((d) => {
        if (d.usuario) setData(d)
        else throw new Error("No user data")
      })
      .catch(() => {
        // Check if user is cuerpo técnico instead
        fetch("/api/ct/me")
          .then((res) => {
            if (res.ok) {
              window.location.href = "/cuerpotecnico"
            }
          })
          .catch(() => {})
      })

    // Load upcoming games
    fetch("/api/mis-partidos")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.designaciones) return
        // Compare date strings directly (YYYY-MM-DD) to avoid timezone issues
        const todayStr = new Date().toISOString().slice(0, 10)
        // Deduplicate by partidoId (same person can have multiple roles in same game)
        const seen = new Set<string>()
        const upcoming = d.designaciones
          .filter((d: PartidoProximo) => {
            const fechaStr = d.partido.fecha ? String(d.partido.fecha).slice(0, 10) : ""
            return fechaStr >= todayStr
          })
          .filter((d: PartidoProximo) => {
            if (seen.has(d.partido.id)) return false
            seen.add(d.partido.id)
            return true
          })
          .slice(0, 3)
        setPartidos(upcoming)
      })
      .catch(() => {})
  }, [])

  if (!data || !data.usuario) {
    return <PageSkeleton />
  }

  const { usuario, unreadNotifications } = data
  const roles = usuario.roles?.map((r) => r.rol) ?? []
  const isAdmin = roles.includes("SUPER_ADMIN")

  return (
    <div className="space-y-6">
      <PortalInstallPrompt
        storageKey="oficiales"
        appName="CPB Oficiales"
        appSubtitle="Tu portal de árbitros y oficiales"
        benefits={[
          "Carnet digital siempre disponible, sin internet",
          "Tus partidos asignados y notificaciones",
          "Cursos y capacitaciones de la CPB",
        ]}
      />
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Hola, {usuario.nombre}
        </h1>
        <p className="text-muted-foreground">
          Bienvenido al portal de oficiales de la CPB
        </p>
      </div>

      {/* Status banner */}
      {usuario.estadoVerificacion === "PENDIENTE" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Perfil en revisión</p>
            <p className="text-sm text-yellow-700">
              Tu solicitud está siendo revisada por el equipo de la CPB.
              Te notificaremos cuando sea aprobada.
            </p>
          </div>
        </div>
      )}

      {usuario.estadoVerificacion === "RECHAZADO" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Perfil rechazado</p>
            <p className="text-sm text-red-700">
              {usuario.motivoRechazo || "Tu solicitud fue rechazada. Contactá al administrador para más información."}
            </p>
            <Link href="/oficiales/perfil">
              <Button variant="outline" size="sm" className="mt-2">
                Actualizar documentos
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Roles */}
      <div className="flex gap-2 flex-wrap">
        {usuario.roles.map((r) => (
          <Badge key={r.rol} variant="secondary">
            {ROL_LABELS[r.rol] || r.rol}
          </Badge>
        ))}
      </div>

      {/* Mis próximos partidos */}
      {!isAdmin && usuario.estadoVerificacion === "VERIFICADO" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Mis próximos partidos
            </h2>
            <Link
              href="/oficiales/mis-partidos"
              className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {partidos.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-400">No tenés partidos asignados próximamente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {partidos.map(d => {
                const esHoy = new Date(d.partido.fecha).toDateString() === new Date().toDateString()
                const fechaDisplay = new Date(d.partido.fecha).toLocaleDateString("es-PY", {
                  weekday: "short", day: "numeric", month: "short",
                })
                return (
                  <Link
                    key={d.id}
                    href="/oficiales/mis-partidos"
                    className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3.5 hover:shadow-sm transition-shadow"
                  >
                    <div className={`h-10 w-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${esHoy ? "bg-orange-100" : "bg-primary/10"}`}>
                      <span className={`text-[10px] font-bold uppercase ${esHoy ? "text-orange-600" : "text-primary"}`}>
                        {esHoy ? "HOY" : new Date(d.partido.fecha).toLocaleDateString("es-PY", { month: "short" }).replace(".", "")}
                      </span>
                      {!esHoy && (
                        <span className={`text-sm font-bold ${esHoy ? "text-orange-600" : "text-primary"}`}>
                          {new Date(d.partido.fecha).getDate()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {d.partido.equipoLocal} <span className="font-normal text-gray-400">vs</span> {d.partido.equipoVisit}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {d.partido.hora?.slice(0, 5)} hs
                        </span>
                        {d.partido.cancha && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {d.partido.cancha}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 shrink-0">
                      {ROL_LABEL_CORTO[d.rol] || d.rol}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Push notification activation */}
      {!isAdmin && pushStatus === "default" && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <BellRing className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900">Activá las notificaciones</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Te avisamos cuando te asignen un partido
            </p>
          </div>
          <button
            onClick={activarPush}
            disabled={activandoPush}
            className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {activandoPush ? "..." : "Activar"}
          </button>
        </div>
      )}
      {!isAdmin && pushStatus === "granted" && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-3.5 flex items-center gap-3">
          <BellRing className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700 font-medium">Notificaciones activadas</p>
        </div>
      )}

      {/* Announcement popup */}
      {showAnnouncement && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={dismissAnnouncement}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl max-w-sm w-full shadow-2xl z-10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-6 pt-8 pb-10 text-center relative">
              <button
                onClick={dismissAnnouncement}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-yellow-300 text-xs font-bold uppercase tracking-wider">Nueva funcionalidad</span>
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </div>
              <h3 className="text-white text-xl font-bold">
                Buscador de Cuerpo Tecnico
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 pt-5 pb-6 -mt-4 bg-white rounded-t-2xl relative">
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                Ahora podes <strong>verificar el carnet de cualquier miembro del Cuerpo Tecnico</strong> directamente desde tu celular.
              </p>
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Search className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Busca por <strong>nombre o CI</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Verifica si esta <strong>habilitado</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700">Ve su <strong>foto, rol y datos</strong></span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={dismissAnnouncement}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Ahora no
                </button>
                <Link
                  href="/oficiales/verificar-ct"
                  onClick={dismissAnnouncement}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold text-center hover:bg-primary/90 transition-colors"
                >
                  Ir a probar
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick access */}
      {!isAdmin ? (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          <QuickRow
            href="/oficiales/carnet"
            icon={<CreditCard className="h-5 w-5" />}
            title="Mi carnet"
            description={usuario.estadoVerificacion === "VERIFICADO" ? "Ver carnet digital" : "Pendiente de verificación"}
          />
          <QuickRow
            href="/oficiales/notificaciones"
            icon={<Bell className="h-5 w-5" />}
            title="Notificaciones"
            badge={unreadNotifications > 0 ? String(unreadNotifications) : undefined}
            description={unreadNotifications > 0 ? `${unreadNotifications} sin leer` : "Al día"}
          />
          <QuickRow
            href="/oficiales/verificar-ct"
            icon={<Search className="h-5 w-5" />}
            title="Verificar CT"
            description="Buscar miembros del cuerpo técnico"
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          <QuickRow href="/oficiales/admin/usuarios" icon={<Users className="h-5 w-5" />} title="Usuarios" description="Gestionar usuarios" />
          <QuickRow href="/oficiales/admin/pagos" icon={<DollarSign className="h-5 w-5" />} title="Pagos" description="Revisar comprobantes" />
          <QuickRow href="/oficiales/admin/cursos" icon={<BookOpen className="h-5 w-5" />} title="Cursos" description="Gestionar cursos" />
          <QuickRow href="/oficiales/admin/notificaciones" icon={<Bell className="h-5 w-5" />} title="Notificaciones" description="Enviar notificaciones" />
        </div>
      )}
    </div>
  )
}

function QuickRow({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {badge && (
        <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </Link>
  )
}
