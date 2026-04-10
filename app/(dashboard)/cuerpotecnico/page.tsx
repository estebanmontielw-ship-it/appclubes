"use client"

import { useState, useEffect, useRef } from "react"
import { CheckCircle, Clock, XCircle, AlertCircle, CreditCard, FileText, Bell, User, ChevronRight, Camera, Loader2, Upload, RefreshCw } from "lucide-react"
import Link from "next/link"
import PortalInstallPrompt from "@/components/PortalInstallPrompt"
import AceptarTerminosModal from "@/components/AceptarTerminosModal"

const rolLabels: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
  NUTRICIONISTA: "Nutricionista",
}

const estadoConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  PENDIENTE: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Clock, label: "Tu solicitud está pendiente de aprobación" },
  HABILITADO: { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle, label: "Estás habilitado para la temporada" },
  RECHAZADO: { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle, label: "Tu solicitud fue rechazada" },
  SUSPENDIDO: { color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: AlertCircle, label: "Tu habilitación fue suspendida" },
}

export default function CTDashboardPage() {
  const [ct, setCt] = useState<any>(null)
  const [localTerminos] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("cpb_terminos_v1") === "1"
  )

  useEffect(() => {
    fetch("/api/ct/me").then(r => r.json()).then(data => setCt(data.ct)).catch(() => {})
  }, [])

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null)
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

  async function handleUploadRequerido(e: React.ChangeEvent<HTMLInputElement>, docKey: string, field: "fotoCarnetUrl" | "fotoCedulaUrl" | "comprobanteUrl", bucket: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDocKey(docKey)
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
        body: JSON.stringify({ [field]: url, clearDocRequerido: docKey }),
      })
      if (updateRes.ok) {
        const data = await updateRes.json()
        setCt(data.ct)
      }
    } catch {} finally { setUploadingDocKey(null) }
  }

  if (!ct) return <div className="py-12 text-center text-gray-400">Cargando...</div>

  const estado = estadoConfig[ct.estadoHabilitacion] || estadoConfig.PENDIENTE
  const StatusIcon = estado.icon
  const needsPhoto = !ct.fotoCarnetUrl
  const needsCedula = !ct.fotoCedulaUrl
  const needsComprobante = !ct.comprobanteUrl && !ct.pagoAutoVerificado
  const docsRequeridos: string[] = ct.documentosRequeridos ? JSON.parse(ct.documentosRequeridos) : []

  const DOC_CONFIG: Record<string, { label: string; sublabel: string; field: "fotoCarnetUrl" | "fotoCedulaUrl" | "comprobanteUrl"; bucket: string; icon: any }> = {
    comprobante: { label: "Comprobante de pago", sublabel: `Transferencia bancaria de ${Number(ct.montoHabilitacion).toLocaleString("es-PY")} Gs. al BNF`, field: "comprobanteUrl", bucket: "comprobantes", icon: Upload },
    foto_carnet: { label: "Foto tipo carnet", sublabel: "Foto de frente, fondo claro", field: "fotoCarnetUrl", bucket: "fotos-carnet", icon: Camera },
    foto_cedula: { label: "Foto de cédula de identidad", sublabel: "Foto del frente de tu cédula", field: "fotoCedulaUrl", bucket: "fotos-cedula", icon: CreditCard },
  }

  return (
    <div className="max-w-3xl space-y-4">
      {!ct?.aceptoTerminosEn && !localTerminos && (
        <AceptarTerminosModal onAceptado={() => setCt((prev: any) => ({ ...prev, aceptoTerminosEn: new Date().toISOString() }))} />
      )}
      {/* Admin-requested documents — blocking modal (highest priority) */}
      {docsRequeridos.length > 0 && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <AlertCircle className="h-7 w-7 text-amber-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">La CPB solicitó documentos</h2>
              <p className="text-sm text-gray-500 mt-1">Necesitamos que actualices los siguientes documentos para continuar.</p>
              {ct.mensajeDocumentos && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">{ct.mensajeDocumentos}</p>
              )}
            </div>
            <div className="space-y-3">
              {docsRequeridos.map(docKey => {
                const cfg = DOC_CONFIG[docKey]
                if (!cfg) return null
                const DocIcon = cfg.icon
                const isUploading = uploadingDocKey === docKey
                return (
                  <div key={docKey} className="border border-gray-200 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <DocIcon className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{cfg.label}</p>
                        <p className="text-xs text-gray-500">{cfg.sublabel}</p>
                      </div>
                    </div>
                    <label className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 cursor-pointer">
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {isUploading ? "Subiendo..." : "Subir documento"}
                      <input type="file" className="hidden" accept="image/*,.pdf" disabled={!!uploadingDocKey}
                        onChange={(e) => handleUploadRequerido(e, docKey, cfg.field, cfg.bucket)} />
                    </label>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-center text-gray-400">No podés continuar hasta completar todos los documentos</p>
          </div>
        </div>
      )}

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

      <PortalInstallPrompt
        storageKey="cuerpotecnico"
        appName="CPB Cuerpo Técnico"
        appSubtitle="Tu portal de cuerpo técnico"
        benefits={[
          "Carnet digital siempre a mano, sin internet",
          "Credencial oficial de la Confederación",
          "Acceso rápido desde tu pantalla de inicio",
        ]}
      />
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
