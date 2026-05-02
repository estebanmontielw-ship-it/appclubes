"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Shield, Search, Filter, FileText, Paperclip, Loader2,
  AlertTriangle, User, UserX, Mail, Phone, Calendar, MapPin, Save,
} from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  MANIPULACION_RESULTADO: "Manipulación de resultado",
  ACTIVIDAD_APUESTAS: "Actividad de apuestas",
  SOBORNO_INCENTIVO: "Soborno / incentivo",
  CONDUCTA_SOSPECHOSA: "Conducta sospechosa",
  OTRA: "Otra situación",
}

const ESTADO_LABELS: Record<string, string> = {
  NUEVA: "Nueva",
  EN_REVISION: "En revisión",
  ESCALADA: "Escalada",
  ARCHIVADA: "Archivada",
}

const ESTADO_COLORS: Record<string, string> = {
  NUEVA: "bg-blue-100 text-blue-700 border-blue-200",
  EN_REVISION: "bg-amber-100 text-amber-700 border-amber-200",
  ESCALADA: "bg-red-100 text-red-700 border-red-200",
  ARCHIVADA: "bg-gray-100 text-gray-600 border-gray-200",
}

interface Denuncia {
  id: string
  tipoSituacion: string
  competencia: string | null
  partidoEvento: string | null
  descripcion: string
  fechaOcurrencia: string | null
  personasInvolucradas: string | null
  tieneEvidencia: boolean
  descripcionEvidencia: string | null
  archivosUrls: string | null
  modo: string
  contactoNombre: string | null
  contactoEmail: string | null
  contactoTelefono: string | null
  ipHash: string | null
  userAgent: string | null
  // Captura forense
  ipReal: string | null
  pais: string | null
  region: string | null
  ciudad: string | null
  asn: string | null
  referer: string | null
  acceptLanguage: string | null
  browserFingerprint: string | null
  screenInfo: string | null
  timezone: string | null
  platform: string | null
  languages: string | null
  hardwareConcurrency: number | null
  deviceMemory: number | null
  estado: string
  notasAdmin: string | null
  createdAt: string
  updatedAt: string
}

const TABS = [
  { label: "Todas", value: "" },
  { label: "Nuevas", value: "NUEVA" },
  { label: "En revisión", value: "EN_REVISION" },
  { label: "Escaladas", value: "ESCALADA" },
  { label: "Archivadas", value: "ARCHIVADA" },
]

const TIPO_FILTROS = [
  { label: "Todos los tipos", value: "" },
  ...Object.entries(TIPO_LABELS).map(([value, label]) => ({ value, label })),
]

export default function AdminDenunciasPage() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [totalNuevas, setTotalNuevas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("")
  const [buscar, setBuscar] = useState("")
  const [selected, setSelected] = useState<Denuncia | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroEstado) params.set("estado", filtroEstado)
    if (filtroTipo) params.set("tipo", filtroTipo)
    if (buscar) params.set("buscar", buscar)
    try {
      const res = await fetch(`/api/admin/denuncias?${params}`, { credentials: "include" })
      const data = await res.json()
      setDenuncias(data.denuncias || [])
      setTotalNuevas(data.totalNuevas || 0)
    } catch {
      setDenuncias([])
    } finally {
      setLoading(false)
    }
  }, [filtroEstado, filtroTipo, buscar])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-bold md:text-2xl flex items-center gap-2 break-words">
            <Shield className="h-6 w-6 text-primary shrink-0" /> Canal de Denuncias
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Integridad del básquetbol — denuncias confidenciales recibidas
          </p>
        </div>
        {totalNuevas > 0 && (
          <div className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold border border-blue-200 shrink-0">
            {totalNuevas} {totalNuevas === 1 ? "nueva" : "nuevas"}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFiltroEstado(tab.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border ${
                filtroEstado === tab.value
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0 sm:min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 bg-white">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar en descripción, competencia, personas..."
              className="flex-1 text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="text-sm focus:outline-none bg-transparent"
            >
              {TIPO_FILTROS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
        </div>
      ) : denuncias.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
          <Shield className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">No hay denuncias que coincidan con el filtro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {denuncias.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(d)}
              className="w-full text-left bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {d.modo === "anonimo" ? (
                    <UserX className="h-5 w-5 text-gray-400" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ESTADO_COLORS[d.estado]}`}>
                      {ESTADO_LABELS[d.estado]}
                    </span>
                    <span className="text-xs text-gray-500">{TIPO_LABELS[d.tipoSituacion]}</span>
                    {d.tieneEvidencia && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                        <Paperclip className="h-3 w-3" /> Evidencia
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2 break-words">{d.descripcion}</p>
                  <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-400 flex-wrap">
                    <span>{new Date(d.createdAt).toLocaleString("es-PY")}</span>
                    {d.competencia && <span className="break-words">· {d.competencia}</span>}
                    {d.modo === "identificado" && d.contactoNombre && (
                      <span className="break-words">· {d.contactoNombre}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <DenunciaDetalle
          denuncia={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated)
            setDenuncias((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
            load()
          }}
        />
      )}
    </div>
  )
}

function DenunciaDetalle({
  denuncia,
  onClose,
  onUpdated,
}: {
  denuncia: Denuncia
  onClose: () => void
  onUpdated: (d: Denuncia) => void
}) {
  const [estado, setEstado] = useState(denuncia.estado)
  const [notasAdmin, setNotasAdmin] = useState(denuncia.notasAdmin || "")
  const [saving, setSaving] = useState(false)
  const [evidencia, setEvidencia] = useState<{ path: string; url: string | null; error?: string }[]>([])
  const [loadingEvidencia, setLoadingEvidencia] = useState(false)

  useEffect(() => {
    setEstado(denuncia.estado)
    setNotasAdmin(denuncia.notasAdmin || "")
    if (denuncia.archivosUrls) {
      setLoadingEvidencia(true)
      fetch(`/api/admin/denuncias/evidencia?id=${denuncia.id}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setEvidencia(data.archivos || []))
        .catch(() => setEvidencia([]))
        .finally(() => setLoadingEvidencia(false))
    } else {
      setEvidencia([])
    }
  }, [denuncia])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/denuncias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: denuncia.id, estado, notasAdmin }),
      })
      const data = await res.json()
      if (res.ok) onUpdated(data.denuncia)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl max-h-[95vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-gray-900">Denuncia · {denuncia.id.slice(0, 8).toUpperCase()}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ESTADO_COLORS[denuncia.estado]}`}>
              {ESTADO_LABELS[denuncia.estado]}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {TIPO_LABELS[denuncia.tipoSituacion]}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(denuncia.createdAt).toLocaleString("es-PY")}
            </span>
            {denuncia.modo === "anonimo" ? (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full inline-flex items-center gap-1">
                <UserX className="h-3 w-3" /> Anónima
              </span>
            ) : (
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full inline-flex items-center gap-1">
                <User className="h-3 w-3" /> Identificada
              </span>
            )}
          </div>

          {/* Datos del partido */}
          {(denuncia.competencia || denuncia.partidoEvento || denuncia.fechaOcurrencia) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {denuncia.competencia && (
                <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Competencia" value={denuncia.competencia} />
              )}
              {denuncia.partidoEvento && (
                <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Partido / evento" value={denuncia.partidoEvento} />
              )}
              {denuncia.fechaOcurrencia && (
                <Field icon={<Calendar className="h-3.5 w-3.5" />} label="¿Cuándo ocurrió?" value={denuncia.fechaOcurrencia} />
              )}
            </div>
          )}

          {/* Descripción */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{denuncia.descripcion}</p>
          </div>

          {denuncia.personasInvolucradas && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Personas involucradas</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{denuncia.personasInvolucradas}</p>
            </div>
          )}

          {/* Evidencia */}
          {(denuncia.tieneEvidencia || denuncia.descripcionEvidencia) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Evidencia</p>
              {denuncia.descripcionEvidencia && (
                <p className="text-sm text-gray-800 whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-lg p-3 mb-2">
                  {denuncia.descripcionEvidencia}
                </p>
              )}
              {loadingEvidencia ? (
                <div className="text-xs text-gray-400 inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Cargando archivos...
                </div>
              ) : evidencia.length > 0 ? (
                <ul className="space-y-1">
                  {evidencia.map((a) => (
                    <li key={a.path}>
                      {a.url ? (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline px-3 py-2 bg-white rounded-lg border border-gray-200"
                        >
                          <FileText className="h-4 w-4" /> {a.path}
                        </a>
                      ) : (
                        <span className="text-xs text-red-600">Error: {a.error}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {/* Datos de contacto */}
          {denuncia.modo === "identificado" && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Datos de contacto</p>
              {denuncia.contactoNombre && (
                <p className="text-sm text-gray-800 inline-flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-400" /> {denuncia.contactoNombre}
                </p>
              )}
              {denuncia.contactoEmail && (
                <p className="text-sm text-gray-800 inline-flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <a href={`mailto:${denuncia.contactoEmail}`} className="text-primary hover:underline">
                    {denuncia.contactoEmail}
                  </a>
                </p>
              )}
              {denuncia.contactoTelefono && (
                <p className="text-sm text-gray-800 inline-flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400" /> {denuncia.contactoTelefono}
                </p>
              )}
            </div>
          )}

          {/* Forensic data — solo visible para SUPER_ADMIN */}
          <details className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-amber-800">
              🔒 Datos forenses del reportante
            </summary>
            <div className="mt-3 space-y-3">
              {/* Ubicación */}
              {(denuncia.pais || denuncia.ciudad || denuncia.asn) && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-1">Ubicación / Conexión</p>
                  <div className="space-y-0.5 text-gray-700 font-mono">
                    {denuncia.pais && <p>País: {denuncia.pais}{denuncia.region ? ` · ${denuncia.region}` : ""}{denuncia.ciudad ? ` · ${denuncia.ciudad}` : ""}</p>}
                    {denuncia.asn && <p>ASN: {denuncia.asn}</p>}
                    {denuncia.ipReal && <p className="break-all">IP: {denuncia.ipReal}</p>}
                    <p className="break-all">IP hash: {denuncia.ipHash || "—"}</p>
                  </div>
                </div>
              )}

              {/* Browser fingerprint */}
              {(denuncia.browserFingerprint || denuncia.screenInfo) && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-1">Browser Fingerprint</p>
                  <div className="space-y-0.5 text-gray-700 font-mono">
                    {denuncia.browserFingerprint && <p className="break-all">FP: {denuncia.browserFingerprint.slice(0, 32)}…</p>}
                    {denuncia.screenInfo && <p>Pantalla: {denuncia.screenInfo}</p>}
                    {denuncia.platform && <p>Plataforma: {denuncia.platform}</p>}
                    {denuncia.timezone && <p>Zona horaria: {denuncia.timezone}</p>}
                    {denuncia.languages && <p>Idiomas: {denuncia.languages}</p>}
                    {denuncia.hardwareConcurrency != null && <p>CPU cores: {denuncia.hardwareConcurrency}</p>}
                    {denuncia.deviceMemory != null && <p>RAM (GB): {denuncia.deviceMemory}</p>}
                  </div>
                </div>
              )}

              {/* Headers */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-1">Request</p>
                <div className="space-y-0.5 text-gray-700 font-mono">
                  <p className="break-all">User agent: {denuncia.userAgent || "—"}</p>
                  {denuncia.acceptLanguage && <p>Accept-Lang: {denuncia.acceptLanguage}</p>}
                  {denuncia.referer && <p className="break-all">Referer: {denuncia.referer}</p>}
                </div>
              </div>

              <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-amber-200">ID interno: {denuncia.id}</p>
            </div>
          </details>

          {/* Acciones admin */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {Object.entries(ESTADO_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notas internas</label>
              <textarea
                value={notasAdmin}
                onChange={(e) => setNotasAdmin(e.target.value)}
                rows={4}
                placeholder="Anotaciones de la investigación, gestiones realizadas, decisiones tomadas..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            {estado === "ESCALADA" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Marcaste esta denuncia como <strong>escalada</strong>. Asegurate de notificar al área legal y/o FIBA Integrity según corresponda.</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
          >
            Cerrar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider inline-flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm text-gray-800 mt-1">{value}</p>
    </div>
  )
}
