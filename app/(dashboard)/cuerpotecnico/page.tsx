"use client"

import { useState, useEffect, useRef } from "react"
import { CheckCircle, Clock, XCircle, AlertCircle, CreditCard, FileText, Bell, User, ChevronRight, Camera, Loader2, Upload } from "lucide-react"
import Link from "next/link"
import PortalInstallPrompt from "@/components/PortalInstallPrompt"

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
  const [ct, setCt] = useState<any>(null)

  useEffect(() => {
    fetch("/api/ct/me").then(r => r.json()).then(data => setCt(data.ct)).catch(() => {})
  }, [])

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, field: "fotoCarnetUrl" | "fotoCedulaUrl" | "comprobanteUrl", bucket: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", bucket)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error()
      const { url } = await res.json()

      const updateRes = await fetch("/api/ct/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: url }),
      })
      if (updateRes.ok) {
        setCt({ ...ct, [field]: url })
      }
    } catch {} finally { setUploadingPhoto(false) }
  }

  if (!ct) return <div className="py-12 text-center text-gray-400">Cargando...</div>

  const estado = estadoConfig[ct.estadoHabilitacion] || estadoConfig.PENDIENTE
  const StatusIcon = estado.icon
  const needsPhoto = !ct.fotoCarnetUrl
  const needsCedula = !ct.fotoCedulaUrl
  const needsComprobante = !ct.comprobanteUrl && !ct.pagoAutoVerificado

  return (
    <div className="max-w-3xl space-y-4">
      {/* Photo required popup */}
      {needsPhoto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Foto de carnet requerida</h2>
            <p className="text-sm text-gray-500 mt-2">
              Para completar tu registro y activar tu carnet digital, necesitamos tu foto tipo carnet.
            </p>
            <p className="text-xs text-gray-400 mt-1">Foto de frente, fondo claro</p>

            <label className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 cursor-pointer">
              {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploadingPhoto ? "Subiendo..." : "Subir mi foto"}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, "fotoCarnetUrl", "fotos-carnet")} disabled={uploadingPhoto} />
            </label>
          </div>
        </div>
      )}

      {/* Cédula required popup (shows after carnet is uploaded) */}
      {!needsPhoto && needsCedula && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Foto de cédula requerida</h2>
            <p className="text-sm text-gray-500 mt-2">
              Necesitamos una foto del frente de tu cédula de identidad para verificar tus datos.
            </p>

            <label className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 cursor-pointer">
              {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {uploadingPhoto ? "Subiendo..." : "Subir foto de cédula"}
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleUpload(e, "fotoCedulaUrl", "fotos-cedula")} disabled={uploadingPhoto} />
            </label>
          </div>
        </div>
      )}

      {/* Comprobante required popup (shows after photo and cedula are uploaded) */}
      {!needsPhoto && !needsCedula && needsComprobante && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Comprobante de pago requerido</h2>
            <p className="text-sm text-gray-500 mt-2">
              Para procesar tu habilitación, necesitamos el comprobante de tu transferencia bancaria.
            </p>
            <p className="text-xs text-gray-400 mt-1">Captura de pantalla o foto del comprobante</p>

            <label className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 cursor-pointer">
              {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadingPhoto ? "Subiendo..." : "Subir comprobante"}
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleUpload(e, "comprobanteUrl", "comprobantes")} disabled={uploadingPhoto} />
            </label>
          </div>
        </div>
      )}

      <PortalInstallPrompt portalName="CPB Cuerpo Técnico" portalDesc="Accedé directo a tu carnet y recursos desde tu celular" />
      <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {ct.nombre}</h1>

      {/* Status */}
      <div className={`rounded-2xl border p-5 ${estado.bg}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className={`h-6 w-6 shrink-0 mt-0.5 ${estado.color}`} />
          <div>
            <p className={`font-semibold ${estado.color}`}>{ct.estadoHabilitacion}</p>
            <p className={`text-sm mt-0.5 ${estado.color} opacity-80`}>{estado.label}</p>
            {ct.motivoRechazo && <p className="text-sm mt-2 text-red-600">Motivo: {ct.motivoRechazo}</p>}
          </div>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-4">
          {ct.fotoCarnetUrl ? (
            <img src={ct.fotoCarnetUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-bold text-lg text-gray-900">{ct.nombre} {ct.apellido}</p>
            <p className="text-sm text-gray-500">{rolLabels[ct.rol] || ct.rol}</p>
            <p className="text-xs text-gray-400">CI: {ct.cedula}</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/cuerpotecnico/carnet" className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">Mi carnet</p>
            <p className="text-xs text-gray-500">Carnet digital</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>

        <Link href="/cuerpotecnico/recursos" className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">Recursos</p>
            <p className="text-xs text-gray-500">Material de estudio</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>

        <Link href="/cuerpotecnico/notificaciones" className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">Notificaciones</p>
            <p className="text-xs text-gray-500">Mensajes</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
          <h2 className="font-semibold text-gray-900 text-sm">Mis datos</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Email:</span> <p className="font-medium break-all">{ct.email}</p></div>
            <div><span className="text-gray-500">Teléfono:</span> <p className="font-medium">{ct.telefono}</p></div>
            <div><span className="text-gray-500">Ciudad:</span> <p className="font-medium">{ct.ciudad}</p></div>
            <div><span className="text-gray-500">Nacionalidad:</span> <p className="font-medium">{ct.nacionalidad}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Habilitación</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monto</p>
              <p className="text-lg font-bold text-gray-900">{Number(ct.montoHabilitacion).toLocaleString("es-PY")} Gs.</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${ct.pagoVerificado ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {ct.pagoVerificado ? "Pago verificado" : "Pago pendiente"}
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="text-center py-2">
        <p className="text-xs text-gray-400">¿Tenés alguna consulta?</p>
        <a href="mailto:cpb@cpb.com.py" className="text-xs text-primary font-medium hover:underline">cpb@cpb.com.py</a>
      </div>
    </div>
  )
}
