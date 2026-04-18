"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2, Lock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const CATEGORIAS_PUSH = [
  { id: "lnb", label: "Liga Nacional Masculina", sublabel: "LNB", available: true, description: "Resultados y partidos en vivo" },
  { id: "lnbf", label: "Liga Nacional Femenina", sublabel: "LNBF", available: true, description: "Resultados y partidos en vivo" },
  { id: "u22m", label: "Sub-22 Masculino", sublabel: "U22", available: false, description: "Próximamente disponible" },
  { id: "u22f", label: "Sub-22 Femenino", sublabel: "U22F", available: false, description: "Próximamente disponible" },
]

type PermissionState = "checking" | "granted" | "denied" | "default"

export default function NotificacionesPage() {
  const { toast } = useToast()
  const [permState, setPermState] = useState<PermissionState>("checking")
  const [activating, setActivating] = useState(false)
  const [categorias, setCategorias] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("Notification" in window)) { setPermState("denied"); return }
    setPermState(Notification.permission as PermissionState)

    // Load saved categorias
    fetch("/api/me/preferencias").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.profile?.alertasCategorias) {
        try { setCategorias(JSON.parse(d.profile.alertasCategorias)) } catch { setCategorias([]) }
      }
    })
  }, [])

  const requestPush = async () => {
    setActivating(true)
    try {
      const { requestNotificationPermission } = await import("@/lib/firebase")
      const token = await requestNotificationPermission()

      if (Notification.permission === "granted") {
        setPermState("granted")
        if (token) {
          await fetch("/api/push/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          })
          toast({ title: "Notificaciones activadas", description: "Te avisaremos cuando haya partidos" })
        }
      } else {
        setPermState("denied")
        toast({
          variant: "destructive",
          title: "Permiso denegado",
          description: "Habilitá las notificaciones en la configuración de tu navegador",
        })
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error al activar" })
    } finally {
      setActivating(false)
    }
  }

  const toggleCategoria = (id: string) => {
    if (!CATEGORIAS_PUSH.find(c => c.id === id)?.available) return
    setCategorias(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const saveCategorias = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/me/preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertasCategorias: categorias }),
      })
      if (res.ok) toast({ title: "Preferencias guardadas" })
      else toast({ variant: "destructive", title: "Error al guardar" })
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Push permission card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start gap-4">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
            permState === "granted" ? "bg-green-100" : "bg-gray-100"
          )}>
            {permState === "granted"
              ? <Bell className="h-6 w-6 text-green-600" />
              : <BellOff className="h-6 w-6 text-gray-400" />
            }
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Notificaciones push</h2>
            {permState === "checking" && <p className="text-sm text-gray-400 mt-1">Verificando...</p>}
            {permState === "granted" && (
              <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                Activadas — recibirás alertas de partidos
              </p>
            )}
            {permState === "default" && (
              <>
                <p className="text-sm text-gray-500 mt-1">Activá las notificaciones para recibir alertas de partidos en tiempo real directamente en tu celular.</p>
                <button
                  onClick={requestPush}
                  disabled={activating}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  {activating ? "Activando..." : "Activar notificaciones"}
                </button>
              </>
            )}
            {permState === "denied" && (
              <div className="mt-2">
                <p className="text-sm text-red-500 font-medium">Permiso bloqueado por el navegador</p>
                <p className="text-xs text-gray-500 mt-1">
                  Para activarlas, andá a la configuración del sitio en tu navegador y habilitá las notificaciones manualmente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-1">¿De qué competencias querés recibir alertas?</h2>
        <p className="text-sm text-gray-500 mb-4">Solo recibirás notificaciones de las categorías que actives</p>

        <div className="space-y-3">
          {CATEGORIAS_PUSH.map(cat => {
            const active = categorias.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategoria(cat.id)}
                disabled={!cat.available}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                  !cat.available && "opacity-60 cursor-not-allowed",
                  cat.available && active && "border-primary bg-primary/5",
                  cat.available && !active && "border-gray-100 hover:border-gray-200 bg-gray-50"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                  !cat.available ? "bg-gray-200 text-gray-400" : active ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                )}>
                  {cat.sublabel}
                </div>
                <div className="flex-1">
                  <p className={cn("font-semibold text-sm", cat.available && active ? "text-primary" : "text-gray-700")}>{cat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    {!cat.available && <Lock className="h-3 w-3" />}
                    {cat.description}
                  </p>
                </div>
                {cat.available && (
                  <div className={cn(
                    "w-12 h-6 rounded-full relative transition-colors",
                    active ? "bg-primary" : "bg-gray-200"
                  )}>
                    <span className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                      active ? "left-6" : "left-0.5"
                    )} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {permState !== "granted" && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 mt-4">
            Activá primero las notificaciones push para que estos ajustes tengan efecto.
          </p>
        )}

        <button
          onClick={saveCategorias}
          disabled={saving || permState !== "granted"}
          className="mt-4 w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar preferencias
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-sm text-blue-700 font-medium mb-1">¿Qué te notificamos?</p>
        <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
          <li>Inicio de partidos de las categorías que elegís</li>
          <li>Resultados finales</li>
          <li>Comunicados oficiales de la CPB</li>
        </ul>
      </div>
    </div>
  )
}
