"use client"

import { useEffect, useState } from "react"
import { Calendar, MapPin, Clock, ExternalLink, Trophy, Plus, X } from "lucide-react"

interface Partido {
  id: string
  fecha: string
  hora: string
  cancha: string
  ciudad: string
  categoria: string
  equipoLocal: string
  equipoVisit: string
  estado: string
  matchId: string | null
}

interface Designacion {
  id: string
  rol: string
  estado: string
  esManual?: boolean
  partido: Partido
}

const ROL_LABELS: Record<string, string> = {
  ARBITRO_PRINCIPAL:    "Árbitro Principal",
  ARBITRO_ASISTENTE_1:  "Árbitro Asistente 1",
  ARBITRO_ASISTENTE_2:  "Árbitro Asistente 2",
  MESA_ANOTADOR:        "Apuntador",
  MESA_CRONOMETRADOR:   "Cronómetro",
  MESA_OPERADOR_24S:    "Lanzamiento 24s",
  MESA_ASISTENTE:       "Relator",
  ESTADISTICO:          "Estadístico",
}

const ROL_COLOR: Record<string, string> = {
  ARBITRO_PRINCIPAL:   "bg-blue-100 text-blue-700",
  ARBITRO_ASISTENTE_1: "bg-blue-50 text-blue-600",
  ARBITRO_ASISTENTE_2: "bg-blue-50 text-blue-600",
  MESA_ANOTADOR:       "bg-purple-50 text-purple-600",
  MESA_CRONOMETRADOR:  "bg-purple-50 text-purple-600",
  MESA_OPERADOR_24S:   "bg-purple-50 text-purple-600",
  MESA_ASISTENTE:      "bg-purple-50 text-purple-600",
  ESTADISTICO:         "bg-gray-100 text-gray-600",
}

const CATEGORIAS = [
  { value: "PRIMERA_DIVISION", label: "LNB – Primera División" },
  { value: "FEMENINO",         label: "LNB Femenino" },
  { value: "SEGUNDA_DIVISION", label: "Segunda División" },
  { value: "U22",              label: "U22" },
  { value: "U18",              label: "U18" },
  { value: "U16",              label: "U16" },
  { value: "U14",              label: "U14" },
  { value: "ESPECIAL",         label: "Especial" },
]

const ROLES = Object.entries(ROL_LABELS).map(([value, label]) => ({ value, label }))

function formatFechaLarga(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-PY", {
    weekday: "long", day: "numeric", month: "long",
  })
}

function formatFechaMes(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-PY", {
    month: "long", year: "numeric",
  })
}

function agruparPorMes(list: Designacion[]): { mes: string; items: Designacion[] }[] {
  const map = new Map<string, Designacion[]>()
  for (const d of list) {
    const mes = formatFechaMes(d.partido.fecha)
    if (!map.has(mes)) map.set(mes, [])
    map.get(mes)!.push(d)
  }
  return Array.from(map.entries()).map(([mes, items]) => ({ mes, items }))
}

function PartidoCard({ d }: { d: Designacion }) {
  const liveUrl = d.partido.matchId
    ? `https://fibalivestats.dcd.shared.geniussports.com/u/FPB/${d.partido.matchId}/`
    : null

  const esHoy = new Date(d.partido.fecha + "T12:00:00").toDateString() === new Date().toDateString()
  const esFuturo = new Date(d.partido.fecha + "T12:00:00") > new Date()
  const catLabel = CATEGORIAS.find(c => c.value === d.partido.categoria)?.label || d.partido.categoria

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
      <div className={`h-1 ${esHoy ? "bg-orange-400" : esFuturo ? "bg-primary" : "bg-gray-200"}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                esHoy
                  ? "bg-orange-100 text-orange-600"
                  : esFuturo
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {esHoy ? "Hoy" : formatFechaLarga(d.partido.fecha)}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {d.partido.hora?.slice(0, 5)} hs
              </span>
              {d.esManual && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                  Manual
                </span>
              )}
            </div>

            <p className="font-bold text-gray-900 text-base leading-tight">{d.partido.equipoLocal}</p>
            <p className="text-xs text-gray-400 my-0.5 font-medium">vs</p>
            <p className="font-bold text-gray-900 text-base leading-tight">{d.partido.equipoVisit}</p>

            <p className="flex items-center gap-1 text-xs text-gray-400 mt-2.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{d.partido.cancha}{d.partido.ciudad ? `, ${d.partido.ciudad}` : ""}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[11px] font-bold text-gray-400 tracking-wide uppercase">
              {catLabel}
            </span>

            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${ROL_COLOR[d.rol] || "bg-gray-100 text-gray-600"}`}>
              {ROL_LABELS[d.rol] || d.rol}
            </span>

            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline mt-1"
              >
                Estadísticas
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ManualPartidoModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (d: Designacion) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    fecha: "",
    hora: "",
    equipoLocal: "",
    equipoVisit: "",
    cancha: "",
    ciudad: "",
    categoria: "PRIMERA_DIVISION",
    rol: "ARBITRO_PRINCIPAL",
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const res = await fetch("/api/mis-partidos/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al guardar")
        return
      }
      // Build a Designacion shape to add to the list
      const desig: Designacion = {
        id: data.designacion.id,
        rol: data.designacion.rol,
        estado: "CONFIRMADA",
        esManual: true,
        partido: {
          id: data.partido.id,
          fecha: data.partido.fecha,
          hora: data.partido.hora,
          cancha: data.partido.cancha,
          ciudad: data.partido.ciudad,
          categoria: data.partido.categoria,
          equipoLocal: data.partido.equipoLocal,
          equipoVisit: data.partido.equipoVisit,
          estado: data.partido.estado,
          matchId: null,
        },
      }
      onCreated(desig)
      onClose()
    } catch {
      setError("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Cargar partido</h2>
            <p className="text-xs text-gray-500 mt-0.5">Agregá un partido que no está en el sistema</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha *</label>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={e => set("fecha", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Hora *</label>
              <input
                type="time"
                required
                value={form.hora}
                onChange={e => set("hora", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Teams */}
          <div>
            <label className={labelCls}>Equipo local *</label>
            <input
              type="text"
              required
              placeholder="Ej: Olimpia Basketball"
              value={form.equipoLocal}
              onChange={e => set("equipoLocal", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Equipo visitante *</label>
            <input
              type="text"
              required
              placeholder="Ej: Colegio San José"
              value={form.equipoVisit}
              onChange={e => set("equipoVisit", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Venue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cancha</label>
              <input
                type="text"
                placeholder="Nombre del gimnasio"
                value={form.cancha}
                onChange={e => set("cancha", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Ciudad</label>
              <input
                type="text"
                placeholder="Asunción"
                value={form.ciudad}
                onChange={e => set("ciudad", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Categoria + Rol */}
          <div>
            <label className={labelCls}>Categoría *</label>
            <select
              value={form.categoria}
              onChange={e => set("categoria", e.target.value)}
              className={inputCls}
            >
              {CATEGORIAS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Mi rol *</label>
            <select
              value={form.rol}
              onChange={e => set("rol", e.target.value)}
              className={inputCls}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar partido"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function MisPartidosPage() {
  const [designaciones, setDesignaciones] = useState<Designacion[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"proximos" | "pasados">("proximos")
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch("/api/mis-partidos")
      .then(r => r.json())
      .then(d => setDesignaciones(d.designaciones || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(desig: Designacion) {
    setDesignaciones(prev => {
      const merged = [...prev, desig]
      // Re-sort by fecha asc
      return merged.sort((a, b) => a.partido.fecha.localeCompare(b.partido.fecha))
    })
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const proximos = designaciones.filter(d => new Date(d.partido.fecha + "T12:00:00") >= now)
  const pasados  = designaciones.filter(d => new Date(d.partido.fecha + "T12:00:00") <  now).reverse()

  const lista = tab === "proximos" ? proximos : pasados
  const grupos = agruparPorMes(lista)

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mis partidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tus designaciones como oficial</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Cargar
        </button>
      </div>

      {/* Stats summary */}
      {!loading && designaciones.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{proximos.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Próximos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{pasados.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pasados</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        <button
          onClick={() => setTab("proximos")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "proximos"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Próximos {proximos.length > 0 && `(${proximos.length})`}
        </button>
        <button
          onClick={() => setTab("pasados")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "pasados"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pasados {pasados.length > 0 && `(${pasados.length})`}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500">
            {tab === "proximos" ? "No tenés partidos próximos" : "No tenés partidos pasados"}
          </p>
          {tab === "proximos" && (
            <p className="text-sm text-gray-400 mt-1">
              Cuando el designador confirme una planilla vas a ver tus partidos acá
            </p>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors mx-auto"
          >
            <Plus className="h-4 w-4" />
            Cargar partido manualmente
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(({ mes, items }) => (
            <div key={mes}>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3 px-1 capitalize">
                {mes}
              </p>
              <div className="space-y-3">
                {items.map(d => <PartidoCard key={d.id} d={d} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual entry modal */}
      {showModal && (
        <ManualPartidoModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
