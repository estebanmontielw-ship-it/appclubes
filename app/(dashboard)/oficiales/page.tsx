"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, BookOpen, FileText, Bell, Users, DollarSign, AlertCircle } from "lucide-react"
import { ROL_LABELS } from "@/lib/constants"
import type { TipoRol, EstadoVerificacion } from "@prisma/client"

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  const { usuario, unreadNotifications } = data
  const roles = usuario.roles.map((r) => r.rol)
  const isAdmin = roles.includes("SUPER_ADMIN")

  return (
    <div className="space-y-6">
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
          <QuickCard
            href="/oficiales/cursos"
            icon={<BookOpen className="h-6 w-6" />}
            title="Mis cursos"
            description="Ver cursos disponibles"
          />
          <QuickCard
            href="/oficiales/recursos"
            icon={<FileText className="h-6 w-6" />}
            title="Recursos"
            description="Material de estudio"
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
