"use client"

import { useEffect, useState } from "react"
import { Calendar, MapPin, Clock, ExternalLink, Trophy, ChevronRight } from "lucide-react"

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

function formatFechaLarga(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-PY", {
    weekday: "long", day: "numeric", month: "long",
  })
}

function formatFechaMes(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-PY", {
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

  const esHoy = new Date(d.partido.fecha).toDateString() === new Date().toDateString()
  const esFuturo = new Date(d.partido.fecha) > new Date()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Colored top bar: green=future, gray=past, orange=today */}
      <div className={`h-1 ${esHoy ? "bg-orange-400" : esFuturo ? "bg-primary" : "bg-gray-200"}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Date + time */}
            <div className="flex items-center gap-2 mb-2.5">
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
            </div>

            {/* Teams */}
            <p className="font-bold text-gray-900 text-base leading-tight">{d.partido.equipoLocal}</p>
            <p className="text-xs text-gray-400 my-0.5 font-medium">vs</p>
            <p className="font-bold text-gray-900 text-base leading-tight">{d.partido.equipoVisit}</p>

            {/* Venue */}
            <p className="flex items-center gap-1 text-xs text-gray-400 mt-2.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{d.partido.cancha}{d.partido.ciudad ? `, ${d.partido.ciudad}` : ""}</span>
            </p>
          </div>

          {/* Right column */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Categoria */}
            <span className="text-[11px] font-bold text-gray-400 tracking-wide uppercase">
              {d.partido.categoria === "PRIMERA_DIVISION" ? "LNB" : d.partido.categoria}
            </span>

            {/* Rol badge */}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${ROL_COLOR[d.rol] || "bg-gray-100 text-gray-600"}`}>
              {ROL_LABELS[d.rol] || d.rol}
            </span>

            {/* Live stats link */}
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

export default function MisPartidosPage() {
  const [designaciones, setDesignaciones] = useState<Designacion[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"proximos" | "pasados">("proximos")

  useEffect(() => {
    fetch("/api/mis-partidos")
      .then(r => r.json())
      .then(d => setDesignaciones(d.designaciones || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const proximos = designaciones.filter(d => new Date(d.partido.fecha) >= now)
  const pasados  = designaciones.filter(d => new Date(d.partido.fecha) <  now).reverse()

  const lista = tab === "proximos" ? proximos : pasados
  const grupos = agruparPorMes(lista)

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Mis partidos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tus designaciones como oficial</p>
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
    </div>
  )
}
