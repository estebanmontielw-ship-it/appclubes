"use client"

import { useEffect, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface Notif {
  id: string
  titulo: string
  mensaje: string
  leido: boolean
  createdAt: string
  link?: string | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  return `hace ${days}d`
}

export default function CTNotificacionesPage() {
  const { toast } = useToast()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const load = () => {
    fetch("/api/ct/notificaciones")
      .then(r => r.json())
      .then(data => setNotifs(data.notificaciones || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markAll = async () => {
    setMarking(true)
    await fetch("/api/ct/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marcarTodas: true }),
    })
    setNotifs(prev => prev.map(n => ({ ...n, leido: true })))
    setMarking(false)
    toast({ title: "Todas marcadas como leídas" })
  }

  const markOne = async (id: string) => {
    await fetch("/api/ct/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n))
  }

  const unread = notifs.filter(n => !n.leido).length

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mensajes y avisos de la CPB</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll} disabled={marking} className="self-start sm:self-auto">
            {marking ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCheck className="h-4 w-4 mr-1" />}
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse">Cargando...</div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No tenés notificaciones</p>
          <p className="text-xs text-gray-400 mt-1">Las notificaciones aparecerán aquí cuando haya novedades</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.leido && markOne(n.id)}
              className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${
                n.leido ? "border-gray-100 opacity-70" : "border-primary/20 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.leido ? "bg-gray-200" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.leido ? "text-gray-500" : "text-gray-900"}`}>{n.titulo}</p>
                    <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-line">{n.mensaje}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
