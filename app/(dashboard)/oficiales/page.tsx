"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, BookOpen, FileText, Bell, Users, DollarSign, AlertCircle, Lock, Search, X, Sparkles } from "lucide-react"
import { PageSkeleton } from "@/components/ui/skeleton"
import { ROL_LABELS } from "@/lib/constants"
import type { TipoRol, EstadoVerificacion } from "@prisma/client"
import PortalInstallPrompt from "@/components/PortalInstallPrompt"

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
  const [showAnnouncement, setShowAnnouncement] = useState(false)

  // Show announcement once
  useEffect(() => {
    if (!localStorage.getItem(ANNOUNCEMENT_KEY)) {
      setShowAnnouncement(true)
    }
  }, [])

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
  }, [])

  if (!data || !data.usuario) {
    return <PageSkeleton />
  }

  const { usuario, unreadNotifications } = data
  const roles = usuario.roles?.map((r) => r.rol) ?? []
  const isAdmin = roles.includes("SUPER_ADMIN")

  return (
    <div className="space-y-6">
      <PortalInstallPrompt portalName="CPB Oficiales" portalDesc="Accedé directo a tu carnet, partidos y cursos desde tu celular" />
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
      <div className="flex gap-2">
        {usuario.roles.map((r) => (
          <Badge key={r.rol} variant="secondary">
            {ROL_LABELS[r.rol] || r.rol}
          </Badge>
        ))}
      </div>

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

      {/* Quick access cards */}
      {!isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickCard
            href="/oficiales/carnet"
            icon={<CreditCard className="h-6 w-6" />}
            title="Mi carnet"
            description={
              usuario.estadoVerificacion === "VERIFICADO"
                ? "Ver carnet digital"
                : "Pendiente de verificación"
            }
          />
          <ComingSoonCard
            icon={<BookOpen className="h-6 w-6" />}
            title="Mis cursos"
            description="Próximamente"
          />
          <ComingSoonCard
            icon={<FileText className="h-6 w-6" />}
            title="Recursos"
            description="Próximamente"
          />
          <QuickCard
            href="/oficiales/notificaciones"
            icon={<Bell className="h-6 w-6" />}
            title="Notificaciones"
            description={
              unreadNotifications > 0
                ? `${unreadNotifications} sin leer`
                : "Al día"
            }
          />
          <QuickCard
            href="/oficiales/verificar-ct"
            icon={<Search className="h-6 w-6" />}
            title="Verificar CT"
            description="Buscar cuerpo técnico"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickCard
            href="/oficiales/admin/usuarios"
            icon={<Users className="h-6 w-6" />}
            title="Usuarios"
            description="Gestionar usuarios"
          />
          <QuickCard
            href="/oficiales/admin/pagos"
            icon={<DollarSign className="h-6 w-6" />}
            title="Pagos"
            description="Revisar comprobantes"
          />
          <QuickCard
            href="/oficiales/admin/cursos"
            icon={<BookOpen className="h-6 w-6" />}
            title="Cursos"
            description="Gestionar cursos"
          />
          <QuickCard
            href="/oficiales/admin/notificaciones"
            icon={<Bell className="h-6 w-6" />}
            title="Notificaciones"
            description="Enviar notificaciones"
          />
        </div>
      )}
    </div>
  )
}

function QuickCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ComingSoonCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="h-full opacity-60">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-gray-100 text-gray-400">{icon}</div>
        <div className="flex-1">
          <p className="font-medium text-gray-400">{title}</p>
          <p className="text-sm text-gray-300">{description}</p>
        </div>
        <Lock className="h-4 w-4 text-gray-300 mt-1" />
      </CardContent>
    </Card>
  )
}
