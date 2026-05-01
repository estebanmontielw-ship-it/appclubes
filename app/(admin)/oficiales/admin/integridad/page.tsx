"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Activity, AlertTriangle, AlertCircle, Loader2, RefreshCw, Play,
  Shield, Users, ExternalLink, ChevronRight, X, FileText, Clock, Radio, Download,
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
  aiSummary: string | null
  aiSummaryModel: string | null
  aiSummaryGeneradoEn: string | null
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

// ─── TAB: JUGADORES TIER ─────────────────────────────────────

interface JugadorTierRow {
  id: string
  nombre: string
  nombreNorm: string
  club: string
  clubSigla: string | null
  numero: number | null
  tier: Tier
  notas: string | null
  activo: boolean
  createdAt: string
}

const TIER_COLOR: Record<Tier, string> = {
  TIER_1: "bg-red-100 text-red-700 border-red-200",
  TIER_2: "bg-amber-100 text-amber-700 border-amber-200",
  TIER_3: "bg-gray-100 text-gray-700 border-gray-200",
}

function TabJugadoresPlaceholder() {
  const [jugadores, setJugadores] = useState<JugadorTierRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTier, setFiltroTier] = useState<"" | Tier>("")
  const [buscar, setBuscar] = useState("")
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<JugadorTierRow | null>(null)
  const [seedeando, setSeedeando] = useState(false)
  const [verDetalle, setVerDetalle] = useState<JugadorTierRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroTier) params.set("tier", filtroTier)
    if (buscar) params.set("buscar", buscar)
    try {
      const res = await fetch(`/api/admin/integridad/jugadores?${params}`, { credentials: "include" })
      const data = await res.json()
      setJugadores(data.jugadores || [])
    } catch {
      setJugadores([])
    } finally {
      setLoading(false)
    }
  }, [filtroTier, buscar])

  useEffect(() => { load() }, [load])

  async function seed() {
    if (!confirm("Va a precargar 15 jugadores tier (idempotente — los existentes no se duplican). ¿Continuar?")) return
    setSeedeando(true)
    try {
      const res = await fetch(`/api/admin/integridad/seed`, {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Listo: ${data.creados} creados, ${data.existentes} ya existían.`)
        await load()
      } else {
        alert(data.error || `Error ${res.status}`)
      }
    } finally {
      setSeedeando(false)
    }
  }

  async function borrar(id: string, nombre: string) {
    if (!confirm(`¿Borrar "${nombre}"?`)) return
    const res = await fetch(`/api/admin/integridad/jugadores/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    if (res.ok) {
      await load()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || `Error ${res.status}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar nombre, club o nota…"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={filtroTier}
          onChange={(e) => setFiltroTier(e.target.value as typeof filtroTier)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
        >
          <option value="">Todos los tiers</option>
          <option value="TIER_1">Tier 1</option>
          <option value="TIER_2">Tier 2</option>
          <option value="TIER_3">Tier 3</option>
        </select>
        <button
          onClick={() => { setEditando(null); setMostrarForm(true) }}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
        >
          + Nuevo
        </button>
        {jugadores.length === 0 && !loading && (
          <button
            onClick={seed}
            disabled={seedeando}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {seedeando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Precargar lista inicial
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 inline-flex items-center justify-center gap-2 w-full">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : jugadores.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 mb-4">No hay jugadores en seguimiento</p>
          <button
            onClick={seed}
            disabled={seedeando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {seedeando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Precargar lista inicial (15 jugadores)
          </button>
        </div>
      ) : (
        <>
          {/* Vista mobile: cards */}
          <div className="md:hidden space-y-2">
            {jugadores.map((j) => (
              <button
                key={j.id}
                onClick={() => setVerDetalle(j)}
                className={`w-full text-left bg-white rounded-xl border p-3 hover:shadow-sm transition-shadow ${!j.activo ? "opacity-50" : ""} ${TIER_COLOR[j.tier].includes("red") ? "border-red-200" : "border-gray-100"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${TIER_COLOR[j.tier]}`}>
                        {j.tier.replace("_", " ")}
                      </span>
                      <p className="font-medium text-gray-900 text-sm">{j.nombre}</p>
                      {j.numero != null && <span className="text-xs text-gray-400">#{j.numero}</span>}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{j.club}{j.clubSigla ? ` (${j.clubSigla})` : ""}</p>
                    {j.notas && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{j.notas}</p>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>

          {/* Vista desktop: tabla */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-gray-500">Tier</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500">Jugador</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Club</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 hidden md:table-cell">Notas</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">Acción</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map((j) => (
                  <tr
                    key={j.id}
                    onClick={() => setVerDetalle(j)}
                    className={`border-b last:border-0 hover:bg-primary/5 cursor-pointer transition-colors ${!j.activo ? "opacity-50" : ""}`}
                  >
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${TIER_COLOR[j.tier]}`}>
                        {j.tier.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-900 inline-flex items-center gap-1.5">
                        {j.nombre}
                        <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-primary" />
                      </p>
                      {j.numero != null && <p className="text-xs text-gray-400">#{j.numero}</p>}
                    </td>
                    <td className="p-3 text-gray-700 hidden sm:table-cell">
                      <p>{j.club}</p>
                      {j.clubSigla && <p className="text-xs text-gray-400">{j.clubSigla}</p>}
                    </td>
                    <td className="p-3 text-gray-600 hidden md:table-cell text-xs max-w-md">
                      <p className="line-clamp-2">{j.notas || "—"}</p>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => { setEditando(j); setMostrarForm(true) }}
                          className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => borrar(j.id, j.nombre)}
                          className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50"
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}

      {mostrarForm && (
        <FormJugador
          jugador={editando}
          onClose={() => setMostrarForm(false)}
          onSaved={() => { setMostrarForm(false); load() }}
        />
      )}

      {verDetalle && (
        <ModalDetalleJugador
          jugador={verDetalle}
          onClose={() => setVerDetalle(null)}
          onEdit={() => { setEditando(verDetalle); setVerDetalle(null); setMostrarForm(true) }}
        />
      )}
    </div>
  )
}

function FormJugador({ jugador, onClose, onSaved }: {
  jugador: JugadorTierRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(jugador?.nombre ?? "")
  const [club, setClub] = useState(jugador?.club ?? "")
  const [clubSigla, setClubSigla] = useState(jugador?.clubSigla ?? "")
  const [numero, setNumero] = useState<string>(jugador?.numero != null ? String(jugador.numero) : "")
  const [tier, setTier] = useState<Tier>(jugador?.tier ?? "TIER_2")
  const [notas, setNotas] = useState(jugador?.notas ?? "")
  const [activo, setActivo] = useState(jugador?.activo ?? true)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!nombre.trim() || !club.trim()) {
      alert("Nombre y club son requeridos")
      return
    }
    setSaving(true)
    try {
      const body = {
        nombre: nombre.trim(),
        club: club.trim(),
        clubSigla: clubSigla.trim() || null,
        numero: numero ? parseInt(numero, 10) : null,
        tier,
        notas: notas.trim(),
        activo,
      }
      const res = await fetch(
        jugador ? `/api/admin/integridad/jugadores/${jugador.id}` : `/api/admin/integridad/jugadores`,
        {
          method: jugador ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      )
      const data = await res.json()
      if (res.ok) {
        onSaved()
      } else {
        alert(data.error || `Error ${res.status}`)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg max-h-[95vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">
            {jugador ? "Editar jugador" : "Nuevo jugador tier"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <Field label="Nombre completo" required>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Club" required>
              <input value={club} onChange={(e) => setClub(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="SAN ALFONZO" />
            </Field>
            <Field label="Sigla">
              <input value={clubSigla} onChange={(e) => setClubSigla(e.target.value.toUpperCase())} maxLength={5} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="ALF" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tier">
              <select value={tier} onChange={(e) => setTier(e.target.value as Tier)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="TIER_1">Tier 1 (alta sospecha)</option>
                <option value="TIER_2">Tier 2 (media)</option>
                <option value="TIER_3">Tier 3 (observación)</option>
              </select>
            </Field>
            <Field label="Número">
              <input type="number" value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </Field>
          </div>
          <Field label="Notas">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="Razón del seguimiento, contexto, partidos previos…"
            />
          </Field>
          {jugador && (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              Activo
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

// ─── TAB: PARTIDOS ───────────────────────────────────────────

function TabPartidos() {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [monitoreados, setMonitoreados] = useState<Array<{ name: string; sigla: string }>>([])
  const [pendientesAnalisis, setPendientesAnalisis] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "finalizados" | "pendientes" | "criticos" | "en_vivo">("finalizados")
  const [analizandoId, setAnalizandoId] = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [bulkAnalizando, setBulkAnalizando] = useState(false)
  const [bulkResultado, setBulkResultado] = useState<{
    total: number; ok: number; errores: number; conPatrones: number
  } | null>(null)
  const [totalSchedule, setTotalSchedule] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Si el usuario está en "Todos", traer TODO el schedule (no solo monitoreados)
      const queryParam = filtroEstado === "todos" ? "?todos=1" : ""
      const res = await fetch(`/api/admin/integridad/partidos${queryParam}`, { credentials: "include" })
      const data = await res.json()
      setPartidos(data.partidos || [])
      setMonitoreados(data.monitoreados || [])
      setPendientesAnalisis(data.pendientesAnalisis ?? 0)
      setTotalSchedule(data.total ?? 0)
    } catch {
      setPartidos([])
    } finally {
      setLoading(false)
    }
  }, [filtroEstado])

  useEffect(() => { load() }, [load])

  async function analizarTodosPendientes() {
    if (!confirm(`Va a analizar ${pendientesAnalisis} partidos pendientes. Puede demorar varios minutos. ¿Continuar?`)) return
    setBulkAnalizando(true)
    setBulkResultado(null)
    try {
      const res = await fetch(`/api/admin/integridad/bulk-analyze`, {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        const conPatrones = (data.resultados ?? []).filter((r: any) => r.ok && (r.patrones ?? 0) > 0).length
        setBulkResultado({
          total: data.procesados ?? 0,
          ok: data.ok ?? 0,
          errores: data.errores ?? 0,
          conPatrones,
        })
        await load()
      } else {
        alert(data.error || `Error ${res.status}`)
      }
    } catch (err: any) {
      alert(`Error: ${err?.message ?? err}`)
    } finally {
      setBulkAnalizando(false)
    }
  }

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
    if (filtroEstado === "en_vivo") return p.estado === "IN_PROGRESS" || p.estado === "EN_CURSO"
    if (filtroEstado === "pendientes") return p.estado !== "COMPLETE"
    return true
  })

  const liveCount = partidos.filter((p) => p.estado === "IN_PROGRESS" || p.estado === "EN_CURSO").length

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

      {/* Filtros (scrollable horizontal en mobile) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {liveCount > 0 && (
          <button
            onClick={() => setFiltroEstado("en_vivo")}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border ${
              filtroEstado === "en_vivo"
                ? "bg-red-600 text-white border-red-600"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            EN VIVO ({liveCount})
          </button>
        )}
        {[
          { v: "finalizados", l: "Finalizados" },
          { v: "criticos", l: "Críticos" },
          { v: "pendientes", l: "Pendientes" },
          { v: "todos", l: "Todos" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setFiltroEstado(t.v as typeof filtroEstado)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border ${
              filtroEstado === t.v
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Acciones (segunda fila en mobile) */}
      {(pendientesAnalisis > 0 || true) && (
        <div className="flex gap-2 flex-wrap">
          {pendientesAnalisis > 0 && (
            <button
              onClick={analizarTodosPendientes}
              disabled={bulkAnalizando}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-white border border-primary hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
              title="Analiza todos los partidos finalizados sin cache"
            >
              {bulkAnalizando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Analizar pendientes ({pendientesAnalisis})
            </button>
          )}
          <button
            onClick={load}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Recargar
          </button>
        </div>
      )}

      {/* Resultado de bulk analyze */}
      {bulkResultado && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Play className="h-4 w-4 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">
              Backfill completo — {bulkResultado.ok} de {bulkResultado.total} partidos analizados
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              {bulkResultado.conPatrones} con patrones detectados
              {bulkResultado.errores > 0 ? ` · ${bulkResultado.errores} errores` : ""}
            </p>
          </div>
          <button onClick={() => setBulkResultado(null)} className="text-green-600 hover:text-green-800 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {bulkAnalizando && !bulkResultado && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-700 shrink-0" />
          <p className="text-sm text-blue-800">
            Analizando {pendientesAnalisis} partidos pendientes... no cierres esta pestaña.
          </p>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando partidos…
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100 px-4">
          <Shield className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 mb-1">No hay partidos para este filtro</p>
          <p className="text-xs text-gray-300">
            {totalSchedule === 0
              ? "El calendario LNB no devolvió partidos. Verificá GENIUS_LNB_COMPETITION_ID."
              : partidos.length === 0
                ? `${totalSchedule} partidos en LNB, pero ninguno con clubes monitoreados. Tocá "Todos" para verlos.`
                : `${partidos.length} partidos cargados — ninguno coincide con este filtro.`}
          </p>
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
          partidoEnVivo={
            partidos.find((p) => p.matchId === seleccionado)?.estado === "IN_PROGRESS" ||
            partidos.find((p) => p.matchId === seleccionado)?.estado === "EN_CURSO"
          }
          onClose={() => setSeleccionado(null)}
          onReanalizar={() => analizar(seleccionado, true)}
          reanalizando={analizandoId === seleccionado}
          onLiveUpdate={() => load()}
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
  const enVivo = p.estado === "IN_PROGRESS" || p.estado === "EN_CURSO"
  const tieneAnalisis = p.analisis !== null

  return (
    <div className={`bg-white rounded-xl border p-4 transition-shadow hover:shadow-sm ${
      enVivo ? "border-red-300 ring-1 ring-red-200" : p.esCritico ? "border-red-200" : "border-gray-100"
    }`}>
      <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
        {/* Badges */}
        <div className="shrink-0 flex sm:flex-col gap-1 flex-wrap">
          {enVivo && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              EN VIVO
            </span>
          )}
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
        <div className="flex-1 min-w-0 w-full sm:w-auto">
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

        {/* Acciones (full width en mobile, stuck a la derecha en sm+) */}
        <div className="shrink-0 flex gap-2 w-full sm:w-auto justify-end">
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
          ) : enVivo ? (
            <button
              onClick={onVer}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700"
              title="Monitorear en vivo (polling FibaLiveStats cada 60s)"
            >
              <Radio className="h-3.5 w-3.5" /> Monitorear
            </button>
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

function ModalAnalisis({ matchId, partidoEnVivo, onClose, onReanalizar, reanalizando, onLiveUpdate }: {
  matchId: string
  partidoEnVivo: boolean
  onClose: () => void
  onReanalizar: () => void
  reanalizando: boolean
  onLiveUpdate: () => void
}) {
  const [analisis, setAnalisis] = useState<Analisis | null>(null)
  const [loading, setLoading] = useState(true)
  const [pollingActivo, setPollingActivo] = useState(partidoEnVivo)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)

  // Carga inicial del análisis cacheado
  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/integridad/analisis/${matchId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAnalisis(d.analisis))
      .catch(() => setAnalisis(null))
      .finally(() => setLoading(false))
  }, [matchId, reanalizando])

  // Live polling cada 60s vía FibaLiveStats (cero quota Genius)
  useEffect(() => {
    if (!pollingActivo) return

    const tick = async () => {
      try {
        const res = await fetch(`/api/admin/integridad/analisis/${matchId}?mode=live`, {
          method: "POST",
          credentials: "include",
        })
        const data = await res.json()
        if (res.ok && data.analisis) {
          setAnalisis(data.analisis)
          setUltimaActualizacion(new Date())
          // Si el partido pasó a COMPLETE, paramos el polling y refrescamos lista
          if (data.analisis.estadoPartido === "COMPLETE") {
            setPollingActivo(false)
            onLiveUpdate()
          }
        }
      } catch {
        // ignorar errores transitorios de red
      }
    }

    tick() // disparar inmediato al abrir
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [pollingActivo, matchId, onLiveUpdate])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl max-h-[95vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="h-5 w-5 text-primary shrink-0" />
            <h2 className="font-semibold text-gray-900 truncate">
              Análisis · partido {matchId}
            </h2>
            {pollingActivo && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                EN VIVO
              </span>
            )}
            {ultimaActualizacion && pollingActivo && (
              <span className="text-[10px] text-gray-400 hidden sm:inline shrink-0">
                · {ultimaActualizacion.toLocaleTimeString("es-PY")}
              </span>
            )}
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

        <div className="flex flex-wrap justify-between gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <a
            href={`https://fibalivestats.dcd.shared.geniussports.com/u/FPB/${matchId}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> Ver en FibaLiveStats
          </a>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
            >
              Cerrar
            </button>
            {analisis && (
              <button
                onClick={async () => {
                  const { generarPDFAnalisis } = await import("@/lib/integridad-pdf")
                  await generarPDFAnalisis(analisis)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5"
                title="Descargar reporte en PDF"
              >
                <Download className="h-4 w-4" /> PDF
              </button>
            )}
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

      {/* Análisis experto generado por Claude */}
      {a.aiSummary && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Análisis experto
            </p>
            {a.aiSummaryGeneradoEn && (
              <span className="text-[10px] text-gray-400">
                {new Date(a.aiSummaryGeneradoEn).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{a.aiSummary}</div>
          </div>
          {a.aiSummaryModel && (
            <p className="text-[10px] text-gray-300 mt-1 text-right">Generado por {a.aiSummaryModel}</p>
          )}
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

// ─── MODAL: DETALLE DEL JUGADOR ──────────────────────────────

interface DetalleJugador {
  jugador: JugadorTierRow & { personId?: number | null }
  personIdSource: "stored" | "snapshot" | "discovered" | null
  datos: "genius_warehouse" | "snapshots_cacheados"
  statsAgregadas: {
    games: number
    minsAvg: number
    pts: number; ptsAvg: number; ptsHigh: number; ptsLow: number
    fg2m: number; fg2a: number; fg2Pct: number | null
    fg3m: number; fg3a: number; fg3Pct: number | null
    ftm: number; fta: number; ftPct: number | null
    rebAvg: number; rebOff: number; rebDef: number
    astAvg: number
    stlAvg: number; blkAvg: number; toAvg: number; pfAvg: number; fr: number
    effAvg: number
    starts: number
  } | null
  patrones: Array<{
    patronId: string
    tipo: string
    tipoLabel: string
    severidad: Severidad
    descripcion: string
    partido: {
      matchId: string
      fecha: string | null
      equipoLocal: string
      equipoVisit: string
      scoreLocal: number | null
      scoreVisit: number | null
    }
  }>
  partidosRecientes: Array<{
    matchId: string
    fecha: string | null
    oponente: string
    oponenteSigla: string | null
    esLocal: boolean
    scorePropio: number | null
    scoreOponente: number | null
    resultado: "GANADO" | "PERDIDO" | "EMPATE" | null
    diferencia: number | null
    mins: number | null
    pts: number
    fg2m: number; fg2a: number; fg2Pct: number | null
    fg3m: number; fg3a: number; fg3Pct: number | null
    ftm: number; fta: number; ftPct: number | null
    rebOff: number; rebDef: number
    reb: number; ast: number
    stl: number; blk: number
    to: number; pf: number; fr: number
    eff: number | null
    plusMinus: number | null
    pos: string | null
    starter: boolean; captain: boolean
    patronesEnPartido: string[]
  }>
}

function ModalDetalleJugador({ jugador, onClose, onEdit }: {
  jugador: JugadorTierRow
  onClose: () => void
  onEdit: () => void
}) {
  const [data, setData] = useState<DetalleJugador | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/integridad/jugadores/${jugador.id}/detalle`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [jugador.id])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl max-h-[95vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-lg ${TIER_COLOR[jugador.tier]}`}>
              {jugador.numero ?? jugador.nombre.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-lg truncate">{jugador.nombre}</h2>
              <p className="text-sm text-gray-500">
                {jugador.club}
                {jugador.clubSigla ? ` (${jugador.clubSigla})` : ""}
                {" · "}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${TIER_COLOR[jugador.tier]}`}>
                  {jugador.tier.replace("_", " ")}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-gray-400 inline-flex items-center justify-center gap-2 w-full">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando dossier…
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-gray-400">No se pudo cargar el detalle</div>
          ) : (
            <>
              {/* Notas internas */}
              {jugador.notas && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notas de seguimiento</p>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{jugador.notas}</p>
                  </div>
                </div>
              )}

              {/* Stats agregadas */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Stats agregadas LNB ({data.statsAgregadas?.games ?? 0} juegos)
                </p>
                {data.statsAgregadas ? (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      <StatBox label="PTS/G" value={data.statsAgregadas.ptsAvg.toFixed(1)} sub={`Max ${data.statsAgregadas.ptsHigh}`} />
                      <StatBox label="REB/G" value={data.statsAgregadas.rebAvg.toFixed(1)} />
                      <StatBox label="AST/G" value={data.statsAgregadas.astAvg.toFixed(1)} />
                      <StatBox label="STL/G" value={data.statsAgregadas.stlAvg.toFixed(1)} />
                      <StatBox label="BLK/G" value={data.statsAgregadas.blkAvg.toFixed(1)} />
                      <StatBox label="TO/G" value={data.statsAgregadas.toAvg.toFixed(1)} highlight={data.statsAgregadas.toAvg > 3} />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                      <StatBox label="MIN/G" value={data.statsAgregadas.minsAvg.toFixed(1)} />
                      <StatBox label="FG2%" value={data.statsAgregadas.fg2Pct != null ? `${data.statsAgregadas.fg2Pct.toFixed(1)}%` : "—"} sub={`${data.statsAgregadas.fg2m}/${data.statsAgregadas.fg2a}`} />
                      <StatBox label="3PT%" value={data.statsAgregadas.fg3Pct != null ? `${data.statsAgregadas.fg3Pct.toFixed(1)}%` : "—"} sub={`${data.statsAgregadas.fg3m}/${data.statsAgregadas.fg3a}`} />
                      <StatBox label="TL%" value={data.statsAgregadas.ftPct != null ? `${data.statsAgregadas.ftPct.toFixed(1)}%` : "—"} sub={`${data.statsAgregadas.ftm}/${data.statsAgregadas.fta}`} />
                      <StatBox label="FALTAS/G" value={data.statsAgregadas.pfAvg.toFixed(1)} />
                      <StatBox label="EFF/G" value={data.statsAgregadas.effAvg.toFixed(1)} />
                    </div>
                    <p className="text-[10px] text-gray-400 text-center mt-2">
                      {data.datos === "genius_warehouse"
                        ? `Datos de Genius Warehouse — todos los partidos del año${data.jugador.personId ? ` (Person ID ${data.jugador.personId})` : ""}`
                        : "Datos de los análisis cacheados — solo partidos analizados"}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 text-center">
                    Sin partidos disponibles. Verificá que el jugador tenga partidos jugados en la temporada actual.
                  </div>
                )}
              </div>

              {/* Patrones detectados */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Patrones detectados ({data.patrones.length})
                </p>
                {data.patrones.length === 0 ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center text-sm text-green-700">
                    No se detectaron patrones sospechosos en partidos analizados.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {data.patrones.map((p) => (
                      <div key={p.patronId} className={`rounded-lg border p-2.5 ${SEV_COLOR[p.severidad]}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{p.tipoLabel}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/60">
                            {SEV_LABEL[p.severidad]}
                          </span>
                          <span className="text-xs opacity-70 ml-auto">
                            {p.partido.fecha?.slice(0, 10) ?? "?"} · {p.partido.equipoLocal} {p.partido.scoreLocal ?? "–"}-{p.partido.scoreVisit ?? "–"} {p.partido.equipoVisit}
                          </span>
                        </div>
                        <p className="text-sm mt-1 opacity-90">{p.descripcion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Últimos partidos */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Últimos partidos ({data.partidosRecientes.length})
                </p>
                {data.partidosRecientes.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 text-center">
                    Sin partidos analizados todavía.
                  </div>
                ) : (
                  <>
                    {/* Vista mobile: cards */}
                    <div className="md:hidden space-y-2">
                      {data.partidosRecientes.map((p) => (
                        <div key={p.matchId} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500">{p.fecha ?? "—"}</p>
                              <p className="text-sm font-medium text-gray-800">
                                {p.esLocal ? "vs" : "@"} {p.oponenteSigla || p.oponente}
                              </p>
                              <p className={`text-xs font-mono ${
                                p.resultado === "GANADO" ? "text-green-700" :
                                p.resultado === "PERDIDO" ? "text-red-700" : "text-gray-500"
                              }`}>
                                {p.scorePropio ?? "–"}-{p.scoreOponente ?? "–"} · {p.resultado === "GANADO" ? "Ganado" : p.resultado === "PERDIDO" ? "Perdido" : "—"}
                              </p>
                            </div>
                            {p.patronesEnPartido.length > 0 && (
                              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                <AlertCircle className="h-3 w-3" /> {p.patronesEnPartido.length}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-white rounded p-1.5 border border-gray-100">
                              <p className="text-[9px] uppercase text-gray-400">PTS</p>
                              <p className="text-base font-bold text-gray-900">{p.pts}</p>
                            </div>
                            <div className="bg-white rounded p-1.5 border border-gray-100">
                              <p className="text-[9px] uppercase text-gray-400">MIN</p>
                              <p className="text-base font-bold text-gray-700">{p.mins != null ? p.mins.toFixed(0) : "–"}</p>
                            </div>
                            <div className="bg-white rounded p-1.5 border border-gray-100">
                              <p className="text-[9px] uppercase text-gray-400">REB</p>
                              <p className="text-base font-bold text-gray-700">{p.reb}</p>
                            </div>
                            <div className="bg-white rounded p-1.5 border border-gray-100">
                              <p className="text-[9px] uppercase text-gray-400">AST</p>
                              <p className="text-base font-bold text-gray-700">{p.ast}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-1.5 text-center text-[11px]">
                            <div><span className="text-gray-400">2PT</span> <span className="font-mono">{p.fg2m}/{p.fg2a}</span></div>
                            <div><span className="text-gray-400">3PT</span> <span className="font-mono">{p.fg3m}/{p.fg3a}</span></div>
                            <div><span className="text-gray-400">TL</span> <span className="font-mono">{p.ftm}/{p.fta}</span></div>
                            <div><span className="text-gray-400">STL</span> <span className="font-mono">{p.stl}</span></div>
                            <div><span className="text-gray-400">BLK</span> <span className="font-mono">{p.blk}</span></div>
                            <div><span className="text-gray-400">TO</span> <span className="font-mono">{p.to}</span></div>
                          </div>
                          {(p.eff != null || p.plusMinus != null) && (
                            <div className="grid grid-cols-2 gap-2 mt-1.5 text-center text-[11px]">
                              {p.eff != null && (
                                <div><span className="text-gray-400">EFF</span> <span className="font-mono font-bold">{Math.round(p.eff)}</span></div>
                              )}
                              {p.plusMinus != null && (
                                <div><span className="text-gray-400">+/-</span> <span className={`font-mono font-bold ${p.plusMinus > 0 ? "text-green-600" : p.plusMinus < 0 ? "text-red-500" : "text-gray-400"}`}>
                                  {p.plusMinus > 0 ? `+${p.plusMinus}` : String(p.plusMinus)}
                                </span></div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Vista desktop: tabla completa */}
                    <div className="hidden md:block overflow-x-auto bg-gray-50 rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left p-2 text-gray-500">Fecha</th>
                          <th className="text-left p-2 text-gray-500">Oponente</th>
                          <th className="text-center p-2 text-gray-500">Resultado</th>
                          <th className="text-center p-2 text-gray-500">Pos</th>
                          <th className="text-center p-2 text-gray-500">MIN</th>
                          <th className="text-center p-2 text-gray-500">PTS</th>
                          <th className="text-center p-2 text-gray-500" title="2 puntos">2PT</th>
                          <th className="text-center p-2 text-gray-500">3PT</th>
                          <th className="text-center p-2 text-gray-500">TL</th>
                          <th className="text-center p-2 text-gray-500" title="Rebotes Of/Def">RO/RD</th>
                          <th className="text-center p-2 text-gray-500">REB</th>
                          <th className="text-center p-2 text-gray-500">AST</th>
                          <th className="text-center p-2 text-gray-500">STL</th>
                          <th className="text-center p-2 text-gray-500">BLK</th>
                          <th className="text-center p-2 text-gray-500">TO</th>
                          <th className="text-center p-2 text-gray-500" title="Faltas pers./recibidas">PF/FR</th>
                          <th className="text-center p-2 text-gray-500" title="Eficiencia">EFF</th>
                          <th className="text-center p-2 text-gray-500" title="Plus/minus">+/-</th>
                          <th className="text-left p-2 text-gray-500">⚠️</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.partidosRecientes.map((p) => (
                          <tr key={p.matchId} className="border-b border-gray-100 last:border-0 hover:bg-white">
                            <td className="p-2 text-gray-600 whitespace-nowrap">{p.fecha ?? "—"}</td>
                            <td className="p-2 whitespace-nowrap">
                              {p.esLocal ? "vs" : "@"} <span className="font-medium">{p.oponenteSigla || p.oponente.slice(0, 6)}</span>
                            </td>
                            <td className="p-2 text-center font-mono whitespace-nowrap">
                              <span className={
                                p.resultado === "GANADO" ? "text-green-700" :
                                p.resultado === "PERDIDO" ? "text-red-700" : "text-gray-500"
                              }>
                                {p.scorePropio ?? "–"}-{p.scoreOponente ?? "–"}
                              </span>
                            </td>
                            <td className="p-2 text-center text-gray-500">{p.pos ?? "—"}</td>
                            <td className="p-2 text-center font-mono">{p.mins != null ? p.mins.toFixed(0) : "–"}</td>
                            <td className="p-2 text-center font-mono font-bold">{p.pts}</td>
                            <td className="p-2 text-center font-mono">{p.fg2m}/{p.fg2a}</td>
                            <td className="p-2 text-center font-mono">{p.fg3m}/{p.fg3a}</td>
                            <td className="p-2 text-center font-mono">{p.ftm}/{p.fta}</td>
                            <td className="p-2 text-center font-mono text-gray-500">{p.rebOff}/{p.rebDef}</td>
                            <td className="p-2 text-center font-mono font-bold">{p.reb}</td>
                            <td className="p-2 text-center font-mono">{p.ast}</td>
                            <td className="p-2 text-center font-mono">{p.stl}</td>
                            <td className="p-2 text-center font-mono">{p.blk}</td>
                            <td className="p-2 text-center font-mono">{p.to}</td>
                            <td className="p-2 text-center font-mono text-gray-500">{p.pf}/{p.fr}</td>
                            <td className="p-2 text-center font-mono">{p.eff != null ? Math.round(p.eff) : "—"}</td>
                            <td className={`p-2 text-center font-mono font-bold ${
                              p.plusMinus == null ? "text-gray-300" :
                              p.plusMinus > 0 ? "text-green-600" :
                              p.plusMinus < 0 ? "text-red-500" : "text-gray-400"
                            }`}>
                              {p.plusMinus == null ? "—" : p.plusMinus > 0 ? `+${p.plusMinus}` : String(p.plusMinus)}
                            </td>
                            <td className="p-2 text-amber-600 font-bold">{p.patronesEnPartido.length > 0 ? p.patronesEnPartido.length : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white">
            Cerrar
          </button>
          {data && (
            <button
              onClick={async () => {
                const { generarPDFJugador } = await import("@/lib/integridad-pdf")
                await generarPDFJugador(data)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5"
              title="Descargar dossier en PDF"
            >
              <Download className="h-4 w-4" /> PDF
            </button>
          )}
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
          >
            Editar jugador
          </button>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, sub, highlight }: {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`bg-white rounded p-2 text-center border ${highlight ? "border-amber-300 bg-amber-50" : "border-gray-100"}`}>
      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
      <p className={`text-base font-bold ${highlight ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 font-mono">{sub}</p>}
    </div>
  )
}
