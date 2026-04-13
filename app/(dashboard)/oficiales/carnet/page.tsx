"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Share2, AlertCircle, WifiOff, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ROL_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { saveCarnetToCache, loadCarnetFromCache } from "@/lib/carnet-cache"
import type { TipoRol, EstadoVerificacion } from "@prisma/client"

interface CarnetData {
  id: string
  nombre: string
  apellido: string
  cedula: string
  ciudad: string
  fotoCarnetUrl: string | null
  estadoVerificacion: EstadoVerificacion
  verificadoEn: string | null
  qrToken: string | null
  roles: { rol: TipoRol }[]
}

export default function CarnetPage() {
  const { toast } = useToast()
  const [usuario, setUsuario] = useState<CarnetData | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null)
  const [retrying, setRetrying] = useState(false)

  async function load(isRetry = false) {
    if (isRetry) setRetrying(true)
    try {
      // Always bypass browser cache to get fresh status
      const res = await fetch("/api/me", { cache: "no-store" })
      if (!res.ok) {
        loadFromCache()
        return
      }
      const data = await res.json()
      setUsuario(data.usuario)
      setIsOffline(false)
      setCacheTimestamp(null)

      let qr: string | null = null
      if (data.usuario.qrToken) {
        const qrRes = await fetch(`/api/qr/${data.usuario.qrToken}`, { cache: "no-store" })
        if (qrRes.ok) {
          const qrData = await qrRes.json()
          qr = qrData.qr
          setQrDataUrl(qr)
        }
      }

      // Save fresh data to cache for offline use
      saveCarnetToCache(data.usuario, qr)
    } catch {
      // Network error — try to load from cache
      loadFromCache()
    } finally {
      setLoading(false)
      if (isRetry) setRetrying(false)
    }
  }

  function loadFromCache() {
    const cached = loadCarnetFromCache()
    if (cached) {
      setUsuario(cached.usuario as CarnetData)
      setQrDataUrl(cached.qrDataUrl)
      setIsOffline(true)
      setCacheTimestamp(cached.timestamp)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()

    // Listen for online/offline events
    const handleOnline = () => load()
    const handleOffline = () => setIsOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    if (!navigator.onLine) setIsOffline(true)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShare = async () => {
    if (!usuario?.qrToken) return
    const url = `${window.location.origin}/verificar/${usuario.qrToken}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "Link copiado al portapapeles" })
    } catch {
      toast({ variant: "destructive", title: "No se pudo copiar" })
    }
  }

  const handleDownloadPDF = () => {
    // Opens the carnet HTML in a new tab — user can print/save as PDF
    window.open("/api/carnet/pdf", "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!usuario) return null

  const isVerified = usuario.estadoVerificacion === "VERIFICADO"
  const isPending = usuario.estadoVerificacion === "PENDIENTE"
  const isRejected = usuario.estadoVerificacion === "RECHAZADO"

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mi Carnet</h1>

      {isOffline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
          <WifiOff className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-700">Mostrando carnet guardado</p>
            {cacheTimestamp && (
              <p className="text-xs text-yellow-600 mt-0.5">
                Guardado el {new Date(cacheTimestamp).toLocaleDateString("es-PY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                {" · "}<span className="font-medium">el estado puede no estar actualizado</span>
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-yellow-300 text-yellow-700 hover:bg-yellow-100 h-8 text-xs"
            disabled={retrying}
            onClick={() => load(true)}
          >
            {retrying ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <><RefreshCw className="h-3 w-3 mr-1" />Actualizar</>
            )}
          </Button>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">
            Tu perfil fue rechazado. Actualizá tus documentos desde tu perfil
            para solicitar una nueva revisión.
          </p>
        </div>
      )}

      {/* Carnet Card */}
      <div
        className={`rounded-2xl border-2 overflow-hidden shadow-lg ${
          isVerified
            ? "border-green-200 bg-white"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center gap-3 ${
            isVerified
              ? "bg-gradient-to-r from-blue-800 to-blue-900"
              : "bg-gray-400"
          }`}
        >
          <img src="/logo-cpb.jpg" alt="CPB" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-white font-semibold text-sm">
              CARNET OFICIAL CPB
            </p>
            <p className="text-white/80 text-xs">
              Confederación Paraguaya de Básquetbol
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex gap-5">
            {/* Photo */}
            <div className="flex-shrink-0">
              {usuario.fotoCarnetUrl ? (
                <img
                  src={usuario.fotoCarnetUrl}
                  alt="Foto carnet"
                  className={`h-28 w-24 rounded-lg object-cover border-2 ${
                    isVerified ? "border-green-200" : "border-gray-200"
                  }`}
                />
              ) : (
                <div className="h-28 w-24 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-gray-400 text-xs text-center">
                    Sin foto
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <p className="text-lg font-bold">
                {usuario.nombre} {usuario.apellido}
              </p>
              <p className="text-sm text-muted-foreground">
                CI: {usuario.cedula}
              </p>

              {/* Roles */}
              <div className="flex gap-1.5 flex-wrap">
                {usuario.roles.map((r) => (
                  <Badge
                    key={r.rol}
                    variant={isVerified ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {ROL_LABELS[r.rol] || r.rol}
                  </Badge>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {usuario.ciudad}, Paraguay
              </p>

              {/* Status */}
              {isVerified && (
                <div className="flex items-center gap-1.5 text-green-600">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium">
                    Verificado
                    {usuario.verificadoEn &&
                      ` — ${formatDate(usuario.verificadoEn)}`}
                  </span>
                </div>
              )}
              {isPending && (
                <div className="flex items-center gap-1.5 text-yellow-600">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-xs font-medium">
                    Pendiente de verificación
                  </span>
                </div>
              )}
              {isRejected && (
                <div className="flex items-center gap-1.5 text-red-600">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs font-medium">Rechazado</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div className="mt-5 flex flex-col items-center">
              <div className="border rounded-lg p-2 bg-white">
                <img
                  src={qrDataUrl}
                  alt="QR de verificación"
                  className="h-40 w-40"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Escaneá para verificar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {isVerified && (
          <Button onClick={handleDownloadPDF} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        )}
        {usuario.qrToken && (
          <Button variant="outline" onClick={handleShare} className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Compartir link
          </Button>
        )}
      </div>
    </div>
  )
}
