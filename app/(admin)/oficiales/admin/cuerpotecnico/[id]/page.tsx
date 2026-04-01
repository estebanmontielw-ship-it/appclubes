"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, X, AlertCircle, Ban, CreditCard } from "lucide-react"

const rolLabels: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
}

const estadoColors: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  HABILITADO: "bg-green-100 text-green-800",
  RECHAZADO: "bg-red-100 text-red-800",
  SUSPENDIDO: "bg-gray-100 text-gray-800",
}

export default function CuerpoTecnicoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [ct, setCt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [showRechazo, setShowRechazo] = useState(false)
  const [showCarnet, setShowCarnet] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/cuerpotecnico/${params.id}`)
      .then(r => r.json())
      .then(data => setCt(data.ct))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleAction(accion: string) {
    if (accion === "rechazar" && !motivo.trim()) return
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/cuerpotecnico/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, motivoRechazo: motivo || undefined }),
      })

      if (res.ok) {
        const { ct: updated } = await res.json()
        setCt(updated)
        setShowRechazo(false)
        setMotivo("")
      }
    } catch {} finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Cargando...</div>
  if (!ct) return <div className="py-12 text-center text-gray-400">No encontrado</div>

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric" }) : "-"

  return (
    <div className="max-w-3xl">
      <Link href="/oficiales/admin/cuerpotecnico" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver a Cuerpo Técnico
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{ct.nombre} {ct.apellido}</h1>
          <p className="text-sm text-gray-500">{rolLabels[ct.rol] || ct.rol} · CI: {ct.cedula}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColors[ct.estadoHabilitacion]}`}>
          {ct.estadoHabilitacion}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Datos Personales</h3>
          <p className="text-sm"><span className="text-gray-500">Email:</span> {ct.email}</p>
          <p className="text-sm"><span className="text-gray-500">Teléfono:</span> {ct.telefono}</p>
          <p className="text-sm"><span className="text-gray-500">Ciudad:</span> {ct.ciudad}</p>
          <p className="text-sm"><span className="text-gray-500">Género:</span> {ct.genero}</p>
          <p className="text-sm"><span className="text-gray-500">Nacionalidad:</span> {ct.nacionalidad}</p>
          <p className="text-sm"><span className="text-gray-500">Nacimiento:</span> {formatDate(ct.fechaNacimiento)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Habilitación</h3>
          <p className="text-sm"><span className="text-gray-500">Monto:</span> {Number(ct.montoHabilitacion).toLocaleString("es-PY")} Gs.</p>
          <p className="text-sm"><span className="text-gray-500">Pago:</span> {ct.pagoVerificado ? "Verificado ✓" : ct.pagoAutoVerificado ? "Auto-verificado ✓" : "Pendiente"}</p>
          <p className="text-sm"><span className="text-gray-500">Título de entrenador:</span> {ct.tieneTitulo ? "Sí" : "No"}</p>
          {ct.razonSocial && <p className="text-sm"><span className="text-gray-500">Razón social:</span> {ct.razonSocial}</p>}
          {ct.ruc && <p className="text-sm"><span className="text-gray-500">RUC:</span> {ct.ruc}</p>}
          <p className="text-sm"><span className="text-gray-500">Registrado:</span> {formatDate(ct.createdAt)}</p>
          {ct.verificadoEn && <p className="text-sm"><span className="text-gray-500">Verificado:</span> {formatDate(ct.verificadoEn)}</p>}
          {ct.motivoRechazo && <p className="text-sm text-red-600"><span className="text-gray-500">Motivo rechazo:</span> {ct.motivoRechazo}</p>}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Documentos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ct.fotoCarnetUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Foto carnet</p>
              <img src={ct.fotoCarnetUrl} alt="Carnet" className="w-full h-32 object-cover rounded-lg border" />
            </div>
          )}
          {ct.fotoCedulaUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Cédula</p>
              <img src={ct.fotoCedulaUrl} alt="Cédula" className="w-full h-32 object-cover rounded-lg border" />
            </div>
          )}
          {ct.tituloEntrenadorUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Título de entrenador</p>
              <img src={ct.tituloEntrenadorUrl} alt="Título" className="w-full h-32 object-cover rounded-lg border" />
            </div>
          )}
          {ct.comprobanteUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Comprobante de pago</p>
              <img src={ct.comprobanteUrl} alt="Comprobante" className="w-full h-32 object-cover rounded-lg border" />
            </div>
          )}
        </div>
      </div>

      {/* Carnet button */}
      {ct.estadoHabilitacion === "HABILITADO" && (
        <div className="mb-6">
          <button onClick={() => setShowCarnet(!showCarnet)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            <CreditCard className="h-4 w-4" /> {showCarnet ? "Ocultar carnet" : "Ver carnet"}
          </button>

          {showCarnet && (
            <div className="mt-4 max-w-sm mx-auto">
              <div className="bg-gradient-to-br from-[#0a1628] to-[#132043] rounded-2xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 via-white to-blue-600 h-2" />
                <div className="p-5 text-center">
                  <img src="/favicon-cpb.png" alt="CPB" className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-white font-bold text-xs tracking-widest">CONFEDERACIÓN PARAGUAYA DE BÁSQUETBOL</p>
                  <p className="text-blue-300 text-[10px] tracking-wider mt-0.5">CUERPO TÉCNICO — HABILITACIÓN {new Date().getFullYear()}</p>
                </div>

                {/* Photo + Info */}
                <div className="px-5 pb-5 flex gap-4">
                  {ct.fotoCarnetUrl ? (
                    <img src={ct.fotoCarnetUrl} alt="" className="w-24 h-28 rounded-xl object-cover border-2 border-white/20 shrink-0" />
                  ) : (
                    <div className="w-24 h-28 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-8 w-8 text-white/30" />
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

                {/* Footer */}
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

      {/* Actions */}
      {ct.estadoHabilitacion === "PENDIENTE" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Acciones</h3>

          {showRechazo ? (
            <div className="space-y-3">
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Motivo del rechazo..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => handleAction("rechazar")} disabled={saving || !motivo.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                  <X className="h-4 w-4" /> Confirmar rechazo
                </button>
                <button onClick={() => setShowRechazo(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleAction("habilitar")} disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                <Check className="h-4 w-4" /> Habilitar
              </button>
              {!ct.pagoVerificado && (
                <button onClick={() => handleAction("verificar_pago")} disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  <Check className="h-4 w-4" /> Verificar pago
                </button>
              )}
              <button onClick={() => setShowRechazo(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200">
                <X className="h-4 w-4" /> Rechazar
              </button>
            </div>
          )}
        </div>
      )}

      {ct.estadoHabilitacion === "HABILITADO" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex gap-2">
            <button onClick={() => handleAction("suspender")} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 disabled:opacity-50">
              <Ban className="h-4 w-4" /> Suspender habilitación
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
