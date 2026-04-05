"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  CheckCheck,
  CreditCard,
  UserCheck,
  UserX,
  DollarSign,
  BookOpen,
  Award,
  Calendar,
  MessageSquare,
  Info,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { TipoNotificacion } from "@prisma/client"

interface Notificacion {
  id: string
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  link: string | null
  leido: boolean
  createdAt: string
}

const ICON_MAP: Record<string, React.ReactNode> = {
  CARNET_VERIFICADO: <UserCheck className="h-4 w-4 text-green-600" />,
  CARNET_RECHAZADO: <UserX className="h-4 w-4 text-red-600" />,
  PAGO_CONFIRMADO: <DollarSign className="h-4 w-4 text-green-600" />,
  PAGO_RECHAZADO: <DollarSign className="h-4 w-4 text-red-600" />,
  CURSO_HABILITADO: <BookOpen className="h-4 w-4 text-blue-600" />,
  CERTIFICADO_EMITIDO: <Award className="h-4 w-4 text-yellow-600" />,
  DESIGNACION_ASIGNADA: <Calendar className="h-4 w-4 text-purple-600" />,
  DESIGNACION_CANCELADA: <Calendar className="h-4 w-4 text-red-600" />,
  MENSAJE_ADMIN: <MessageSquare className="h-4 w-4 text-blue-600" />,
  SISTEMA: <Info className="h-4 w-4 text-gray-600" />,
}

export default function NotificacionesPage() {
  const { toast } = useToast()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadNotifs = async () => {
    try {
      const res = await fetch("/api/notificaciones")
      if (res.ok) {
        const data = await res.json()
        setNotificaciones(data.notificaciones)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifs()

    // Poll for new notifications every 30 seconds
    const timer = setInterval(loadNotifs, 30_000)

    const handleVisibility = () => {
      if (!document.hidden) loadNotifs()
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notificaciones/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      setNotificaciones((prev) =>
        prev.map((n) => ({ ...n, leido: true }))
      )
      setUnreadCount(0)
      toast({ title: "Todas marcadas como leídas" })
    } catch {
      toast({ variant: "destructive", title: "Error" })
    }
  }

  const handleMarkRead = async (notifId: string) => {
    try {
      await fetch("/api/notificaciones/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifId }),
      })
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, leido: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // silently fail
    }
  }

  const timeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMin < 1) return "Ahora"
    if (diffMin < 60) return `Hace ${diffMin}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString("es-PY", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          {unreadCount > 0 && (
            <Badge>{unreadCount} sin leer</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="self-start sm:self-auto">
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {notificaciones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No tenés notificaciones todavía
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notificaciones.map((notif) => {
            const content = (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                  notif.leido
                    ? "bg-white"
                    : "bg-blue-50/50 border-blue-100"
                } ${notif.link ? "cursor-pointer hover:bg-gray-50" : ""}`}
                onClick={() => {
                  if (!notif.leido) handleMarkRead(notif.id)
                }}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100">
                  {ICON_MAP[notif.tipo] || (
                    <Bell className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        notif.leido ? "font-normal" : "font-semibold"
                      }`}
                    >
                      {notif.titulo}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {notif.mensaje}
                  </p>
                </div>
                {!notif.leido && (
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                )}
              </div>
            )

            return notif.link ? (
              <Link key={notif.id} href={notif.link}>
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
