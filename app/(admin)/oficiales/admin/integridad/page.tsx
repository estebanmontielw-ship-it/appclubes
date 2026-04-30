"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Activity, AlertTriangle, AlertCircle, Loader2, RefreshCw, Play,
  Shield, Users, ExternalLink, ChevronRight, X, FileText, Clock,
} from "lucide-react"

// ─── TIPOS ───────────────────────────────────────────────────

type Tier = "TIER_1" | "TIER_2" | "TIER_3"
type Severidad = "BAJO" | "MEDIO" | "ALTO" | "CRITICO"

interface Partido {
  matchId: string
  matchNumber: number | null
  fecha: string | null
  hora: string | null
  estado: string | null
  equipoLocal: string
  equipoLocalSigla: string | null
  equipoLocalLogo: string | null
  equipoVisit: string
  equipoVisitSigla: string | null
  equipoVisitLogo: string | null
  scoreLocal: number | null
  scoreVisit: number | null
  esMonitoreado: boolean
  esCritico: boolean
  analisis: {
    matchId: string
    totalPatrones: number
    severidadMax: Severidad | null
    esCritico: boolean
    generadoEn: string
  } | null
}

interface Patron {
  id: string
  tipo: string
  tipoLabel: string
  severidad: Severidad
  descripcion: string
  datos: Record<string, unknown>
  jugadoresInvolucrados: Array<{ nombre: string; club: string; tier?: Tier }>
  createdAt: string
}

interface Analisis {
  id: string
  matchId: string
  fecha: string | null
  equipoLocal: string
  equipoLocalSigla: string | null
  equipoVisit: string
  equipoVisitSigla: string | null
  scoreLocal: number | null
  scoreVisit: number | null
  totalPuntos: number | null
  periodScores: Array<{ home: number; away: number }> | null
  esCritico: boolean
  totalPatrones: number
  severidadMax: Severidad | null
  estadoPartido: string | null
  generadoEn: string
  patrones: Patron[]
}

// ─── ESTILOS DE SEVERIDAD ────────────────────────────────────

const SEV_LABEL: Record<Severidad, string> = {
  BAJO: "Bajo", MEDIO: "Medio", ALTO: "Alto", CRITICO: "Crítico",
}
const SEV_COLOR: Record<Severidad, string> = {
  BAJO: "bg-gray-100 text-gray-700 border-gray-200",
  MEDIO: "bg-amber-100 text-amber-700 border-amber-200",
  ALTO: "bg-orange-100 text-orange-700 border-orange-200",
  CRITICO: "bg-red-100 text-red-700 border-red-200",
}

// ─── PÁGINA ──────────────────────────────────────────────────

export default function IntegridadPage() {
  const [tab, setTab] = useState<"partidos" | "jugadores">("partidos")

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold md:text-2xl flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" /> Análisis de Manipulación
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Detección automática de patrones sospechosos en partidos LNB.
          Reutiliza datos del API de Genius Sports + FibaLiveStats.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <TabButton active={tab === "partidos"} onClick={() => setTab("partidos")}>
          <Shield className="h-4 w-4" /> Partidos monitoreados
        </TabButton>
        <TabButton active={tab === "jugadores"} onClick={() => setTab("jugadores")}>
          <Users className="h-4 w-4" /> Jugadores Tier
        </TabButton>
      </div>

      {tab === "partidos" && <TabPartidos />}
      {tab === "jugadores" && <TabJugadoresPlaceholder />}
    </div>
  )
}

function TabButton({ active, onClick, children }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  )
}

// Placeholder mientras armamos la sub-commit 4b
function TabJugadoresPlaceholder() {
  return (
    <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
      <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-400">Gestión de jugadores tier — próximo commit</p>
    </div>
  )
}

// ─── TAB: PARTIDOS ───────────────────────────────────────────

function TabPartidos() {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [monitoreados, setMonitoreados] = useState<Array<{ name: string; sigla: string }>>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "finalizados" | "pendientes" | "criticos">("finalizados")
  const [analizandoId, setAnalizandoId] = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/integridad/partidos`, { credentials: "include" })
      const data = await res.json()
      setPartidos(data.partidos || [])
      setMonitoreados(data.monitoreados || [])
    } catch {
      setPartidos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function analizar(matchId: string, force = false) {
    setAnalizandoId(matchId)
    try {
      const url = `/api/admin/integridad/analisis/${matchId}${force ? "?force=1" : ""}`
      const res = await fetch(url, { method: "POST", credentials: "include" })
      if (res.ok) {
        await load()
        setSeleccionado(matchId)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || `Error ${res.status}`)
      }
    } finally {
      setAnalizandoId(null)
    }
  }

  const filtrados = partidos.filter((p) => {
    if (filtroEstado === "criticos") return p.esCritico
    if (filtroEstado === "finalizados") return p.estado === "COMPLETE"
    if (filtroEstado === "pendientes") return p.estado !== "COMPLETE"
    return true
  })

  return (
    <div className="space-y-4">
      {/* Resumen monitoreados */}
      <div className="flex flex-wrap gap-2">
        {monitoreados.map((m) => (
          <span
            key={m.sigla}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
          >
            <Shield className="h-3 w-3" /> {m.name} ({m.sigla})
          </span>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { v: "finalizados", l: "Finalizados" },
          { v: "criticos", l: "Críticos (2 monitoreados)" },
          { v: "pendientes", l: "Pendientes" },
          { v: "todos", l: "Todos" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setFiltroEstado(t.v as typeof filtroEstado)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border ${
              filtroEstado === t.v
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.l}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Recargar
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando partidos…
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
          <Shield className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">No hay partidos para este filtro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((p) => (
            <PartidoCard
              key={p.matchId}
              partido={p}
              analizando={analizandoId === p.matchId}
              onAnalizar={(force) => analizar(p.matchId, force)}
              onVer={() => setSeleccionado(p.matchId)}
            />
          ))}
        </div>
      )}

      {seleccionado && (
        <ModalAnalisis
          matchId={seleccionado}
          onClose={() => setSeleccionado(null)}
          onReanalizar={() => analizar(seleccionado, true)}
          reanalizando={analizandoId === seleccionado}
        />
      )}
    </div>
  )
}

function PartidoCard({ partido: p, analizando, onAnalizar, onVer }: {
  partido: Partido
  analizando: boolean
  onAnalizar: (force: boolean) => void
  onVer: () => void
}) {
  const finalizado = p.estado === "COMPLETE"
  const tieneAnalisis = p.analisis !== null

  return (
    <div className={`bg-white rounded-xl border p-4 transition-shadow hover:shadow-sm ${
      p.esCritico ? "border-red-200" : "border-gray-100"
    }`}>
      <div className="flex items-start gap-3">
        {/* Badges izquierda */}
        <div className="shrink-0 flex flex-col gap-1">
          {p.esCritico && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              <AlertTriangle className="h-3 w-3" /> CRÍTICO
            </span>
          )}
          {p.analisis?.severidadMax && (
            <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEV_COLOR[p.analisis.severidadMax]}`}>
              {SEV_LABEL[p.analisis.severidadMax]}
            </span>
          )}
        </div>

        {/* Equipos + score */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TeamBadge logo={p.equipoLocalLogo} sigla={p.equipoLocalSigla} name={p.equipoLocal} />
            <span className="font-mono text-sm text-gray-600">
              {p.scoreLocal ?? "–"} : {p.scoreVisit ?? "–"}
            </span>
            <TeamBadge logo={p.equipoVisitLogo} sigla={p.equipoVisitSigla} name={p.equipoVisit} />
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
            {p.fecha && <span><Clock className="inline h-3 w-3 mr-1" />{p.fecha}{p.hora ? ` · ${p.hora}` : ""}</span>}
            <span>{p.estado || "—"}</span>
            {tieneAnalisis && (
              <span className="text-primary">
                {p.analisis!.totalPatrones} patrón{p.analisis!.totalPatrones === 1 ? "" : "es"}
              </span>
            )}
          </div>
        </div>

        {/* Acciones derecha */}
        <div className="shrink-0 flex gap-2">
          {tieneAnalisis ? (
            <>
              <button
                onClick={onVer}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90"
              >
                Ver análisis <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onAnalizar(true)}
                disabled={analizando}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                title="Re-analizar"
              >
                {analizando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </button>
            </>
          ) : (
            <button
              onClick={() => onAnalizar(false)}
              disabled={!finalizado || analizando}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!finalizado ? "Disponible al finalizar el partido" : "Analizar partido"}
            >
              {analizando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Analizar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamBadge({ logo, sigla, name }: {
  logo: string | null
  sigla: string | null
  name: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-800 font-medium">
      {logo ? (
        <img src={logo} alt="" className="w-5 h-5 object-contain" />
      ) : (
        <div className="w-5 h-5 rounded bg-gray-200" />
      )}
      <span className="hidden sm:inline">{name}</span>
      <span className="sm:hidden">{sigla || name.slice(0, 3)}</span>
    </span>
  )
}

// ─── MODAL: DETALLE DEL ANÁLISIS ─────────────────────────────

function ModalAnalisis({ matchId, onClose, onReanalizar, reanalizando }: {
  matchId: string
  onClose: () => void
  onReanalizar: () => void
  reanalizando: boolean
}) {
  const [analisis, setAnalisis] = useState<Analisis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/integridad/analisis/${matchId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAnalisis(d.analisis))
      .catch(() => setAnalisis(null))
      .finally(() => setLoading(false))
  }, [matchId, reanalizando])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl max-h-[95vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-gray-900">
              Análisis · partido {matchId}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="py-8 text-center text-gray-400 inline-flex items-center justify-center gap-2 w-full">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          ) : !analisis ? (
            <div className="py-8 text-center text-gray-400">Sin análisis disponible</div>
          ) : (
            <DetalleAnalisis a={analisis} />
          )}
        </div>

        <div className="flex justify-between gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <a
            href={`https://fibalivestats.dcd.shared.geniussports.com/u/FPB/${matchId}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> Ver en FibaLiveStats
          </a>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
            >
              Cerrar
            </button>
            <button
              onClick={onReanalizar}
              disabled={reanalizando}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {reanalizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Re-analizar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetalleAnalisis({ a }: { a: Analisis }) {
  const totalH1 = (a.periodScores?.[0]?.home ?? 0) + (a.periodScores?.[0]?.away ?? 0)
                + (a.periodScores?.[1]?.home ?? 0) + (a.periodScores?.[1]?.away ?? 0)
  const totalH2 = (a.periodScores?.[2]?.home ?? 0) + (a.periodScores?.[2]?.away ?? 0)
                + (a.periodScores?.[3]?.home ?? 0) + (a.periodScores?.[3]?.away ?? 0)

  return (
    <>
      {/* Marcador */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{a.equipoLocalSigla || "Local"}</p>
          <p className="text-3xl font-bold">{a.scoreLocal ?? "–"}</p>
          <p className="text-sm text-gray-700">{a.equipoLocal}</p>
        </div>
        <span className="text-gray-300 text-2xl">·</span>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{a.equipoVisitSigla || "Visit"}</p>
          <p className="text-3xl font-bold">{a.scoreVisit ?? "–"}</p>
          <p className="text-sm text-gray-700">{a.equipoVisit}</p>
        </div>
      </div>

      {/* Score por cuarto */}
      {a.periodScores && a.periodScores.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Score por cuarto</p>
          <div className="overflow-x-auto bg-gray-50 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2 font-medium text-gray-500 text-xs"></th>
                  {a.periodScores.map((_, i) => (
                    <th key={i} className="p-2 text-xs font-medium text-gray-500">Q{i + 1}</th>
                  ))}
                  <th className="p-2 text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-2 text-xs text-gray-700">{a.equipoLocalSigla || "Local"}</td>
                  {a.periodScores.map((p, i) => (
                    <td key={i} className="p-2 text-center font-mono">{p.home}</td>
                  ))}
                  <td className="p-2 text-center font-mono font-bold">{a.scoreLocal ?? "–"}</td>
                </tr>
                <tr>
                  <td className="p-2 text-xs text-gray-700">{a.equipoVisitSigla || "Visit"}</td>
                  {a.periodScores.map((p, i) => (
                    <td key={i} className="p-2 text-center font-mono">{p.away}</td>
                  ))}
                  <td className="p-2 text-center font-mono font-bold">{a.scoreVisit ?? "–"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">Total</p>
              <p className="font-bold">{a.totalPuntos ?? "–"}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">1er tiempo</p>
              <p className="font-bold">{totalH1}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">2do tiempo</p>
              <p className="font-bold">{totalH2}</p>
            </div>
          </div>
        </div>
      )}

      {/* Patrones */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Patrones detectados ({a.patrones.length})
        </p>
        {a.patrones.length === 0 ? (
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
            <p className="text-sm text-green-700">No se detectaron patrones sospechosos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {a.patrones.map((p) => (
              <PatronCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* Recomendación */}
      <RecomendacionBox a={a} />

      <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
        Análisis generado: {new Date(a.generadoEn).toLocaleString("es-PY")}
      </p>
    </>
  )
}

function PatronCard({ p }: { p: Patron }) {
  return (
    <div className={`rounded-lg border p-3 ${SEV_COLOR[p.severidad]}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{p.tipoLabel}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/60">
              {SEV_LABEL[p.severidad]}
            </span>
          </div>
          <p className="text-sm mt-1 opacity-90">{p.descripcion}</p>
          {p.jugadoresInvolucrados.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {p.jugadoresInvolucrados.map((j, i) => (
                <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/60">
                  {j.nombre}{j.tier ? ` · ${j.tier}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecomendacionBox({ a }: { a: Analisis }) {
  let label = "ARCHIVAR"
  let color = "bg-gray-50 border-gray-200 text-gray-700"
  let descripcion = "Sin patrones sospechosos. Partido normal."

  if (a.severidadMax === "CRITICO" || a.totalPatrones >= 4) {
    label = "REVISAR URGENTE"
    color = "bg-red-50 border-red-200 text-red-700"
    descripcion = "Múltiples patrones detectados o partido entre 2 clubes monitoreados. Cruzar con líneas de apuestas IBIA."
  } else if (a.severidadMax === "ALTO" || a.totalPatrones >= 2) {
    label = "REVISAR"
    color = "bg-orange-50 border-orange-200 text-orange-700"
    descripcion = "Patrones de severidad media o múltiples — revisión recomendada."
  } else if (a.totalPatrones >= 1) {
    label = "MONITOREAR"
    color = "bg-amber-50 border-amber-200 text-amber-700"
    descripcion = "Un patrón menor detectado — sigue siendo material para monitoreo."
  }

  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <p className="text-xs font-bold uppercase tracking-wider mb-1">Recomendación: {label}</p>
      <p className="text-sm">{descripcion}</p>
    </div>
  )
}
