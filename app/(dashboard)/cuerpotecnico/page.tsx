"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { LogOut, User, CheckCircle, Clock, XCircle, AlertCircle, CreditCard } from "lucide-react"

const rolLabels: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
}

const estadoConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  PENDIENTE: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Clock, label: "Tu solicitud está pendiente de aprobación" },
  HABILITADO: { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle, label: "Estás habilitado para la temporada" },
  RECHAZADO: { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle, label: "Tu solicitud fue rechazada" },
  SUSPENDIDO: { color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: AlertCircle, label: "Tu habilitación fue suspendida" },
}

export default function CTDashboardPage() {
  const router = useRouter()
  const [ct, setCt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCarnet, setShowCarnet] = useState(false)

  useEffect(() => {
    fetch("/api/ct/me")
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => setCt(data.ct))
      .catch(() => router.push("/cuerpotecnico/login"))
      .finally(() => setLoading(false))
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/cuerpotecnico/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando...</div>
      </div>
    )
  }

  if (!ct) return null

  const estado = estadoConfig[ct.estadoHabilitacion] || estadoConfig.PENDIENTE
  const StatusIcon = estado.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon-cpb.png" alt="CPB" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-bold text-sm text-gray-900">CPB</p>
              <p className="text-[10px] text-gray-400">Cuerpo Técnico</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Welcome */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            {ct.fotoCarnetUrl ? (
              <img src={ct.fotoCarnetUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{ct.nombre} {ct.apellido}</h1>
              <p className="text-sm text-gray-500">{rolLabels[ct.rol] || ct.rol}</p>
              <p className="text-xs text-gray-400">CI: {ct.cedula}</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className={`rounded-2xl border p-5 ${estado.bg}`}>
          <div className="flex items-start gap-3">
            <StatusIcon className={`h-6 w-6 shrink-0 mt-0.5 ${estado.color}`} />
            <div>
              <p className={`font-semibold ${estado.color}`}>{ct.estadoHabilitacion}</p>
              <p className={`text-sm mt-0.5 ${estado.color} opacity-80`}>{estado.label}</p>
              {ct.motivoRechazo && (
                <p className="text-sm mt-2 text-red-600">Motivo: {ct.motivoRechazo}</p>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Mis datos</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Email:</span> <p className="font-medium">{ct.email}</p></div>
            <div><span className="text-gray-500">Teléfono:</span> <p className="font-medium">{ct.telefono}</p></div>
            <div><span className="text-gray-500">Ciudad:</span> <p className="font-medium">{ct.ciudad}</p></div>
            <div><span className="text-gray-500">Nacionalidad:</span> <p className="font-medium">{ct.nacionalidad}</p></div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Habilitación</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monto</p>
              <p className="text-lg font-bold text-gray-900">{Number(ct.montoHabilitacion).toLocaleString("es-PY")} Gs.</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${ct.pagoVerificado ? "bg-green-100 text-green-700" : ct.comprobanteUrl ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
              {ct.pagoVerificado ? "Pago verificado" : ct.comprobanteUrl ? "Pago pendiente de aprobación" : "Pago pendiente"}
            </div>
          </div>
        </div>

        {/* Carnet */}
        {ct.estadoHabilitacion === "HABILITADO" && (
          <div>
            <button onClick={() => setShowCarnet(!showCarnet)}
              className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <CreditCard className="h-4 w-4" />
              {showCarnet ? "Ocultar carnet" : "Ver mi carnet digital"}
            </button>

            {showCarnet && (
              <div className="mt-4">
                <div className="bg-gradient-to-br from-[#0a1628] to-[#132043] rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-red-600 via-white to-blue-600 h-2" />
                  <div className="p-5 text-center">
                    <img src="/favicon-cpb.png" alt="CPB" className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-white font-bold text-xs tracking-widest">CONFEDERACIÓN PARAGUAYA DE BÁSQUETBOL</p>
                    <p className="text-blue-300 text-[10px] tracking-wider mt-0.5">CUERPO TÉCNICO — HABILITACIÓN {new Date().getFullYear()}</p>
                  </div>
                  <div className="px-5 pb-5 flex gap-4">
                    {ct.fotoCarnetUrl ? (
                      <img src={ct.fotoCarnetUrl} alt="" className="w-24 h-28 rounded-xl object-cover border-2 border-white/20 shrink-0" />
                    ) : (
                      <div className="w-24 h-28 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <User className="h-8 w-8 text-white/30" />
                      </div>
                    )}
                    <div className="text-white flex-1 min-w-0">
                      <p className="font-bold text-lg leading-tight">{ct.nombre}</p>
                      <p className="font-bold text-lg leading-tight">{ct.apellido}</p>
                      <p className="text-blue-300 text-xs mt-2">{rolLabels[ct.rol] || ct.rol}</p>
                      <p className="text-white/60 text-xs mt-1">CI: {ct.cedula}</p>
                      <p className="text-white/60 text-xs">{ct.ciudad}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-white/40">ESTADO</p>
                      <p className="text-green-400 text-xs font-bold">HABILITADO</p>
                    </div>
                    {ct.qrToken && (
                      <div className="bg-white rounded-lg p-1">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`https://cpb.com.py/verificar/${ct.qrToken}`)}`} alt="QR" className="w-14 h-14" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">¿Tenés alguna consulta?</p>
          <a href="mailto:cpb@cpb.com.py" className="text-xs text-primary font-medium hover:underline">cpb@cpb.com.py</a>
        </div>
      </div>
    </div>
  )
}
