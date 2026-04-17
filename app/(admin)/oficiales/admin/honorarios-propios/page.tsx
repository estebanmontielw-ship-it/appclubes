"use client"

import { useEffect, useState } from "react"
import { Loader2, Banknote, Users, TrendingUp, Clock, CheckCircle2, ChevronRight, X, ArrowLeft } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────

interface OfficialSummary {
  usuarioId: string
  nombre: string
  apellido: string
  email: string
  fotoCarnetUrl: string | null
  totalPartidos: number
  totalGeneral: number
  totalPendiente: number
  totalPagado: number
  partidosPendientes: number
  partidosPagados: number
}

interface Totales {
  totalGeneral: number
  totalPendiente: number
  totalPagado: number
  totalPartidos: number
  totalOficiales: number
}

interface RegistroDetalle {
  id: string
  fecha: string
  rama: string
  categoria: string
  equipoA: string
  equipoB: string
  rol: string
  faseNombre: string | null
  monto: number | string
  estado: string
  pagadoEn: string | null
  notas: string | null
}

// ─── Helpers ─────────────────────────────────────────────

const CATEGORIA_LABELS: Record<string, string> = {
  LNB_MASC: "LNB", LNB_FEM: "LNB F", U22_MASC: "U22 M", U22_FEM: "U22 F",
  U19: "U19", U17: "U17", U15: "U15", U13: "U13", ESPECIAL: "Especial",
  PRIMERA_DIVISION: "1ª División", SEGUNDA_DIVISION: "2ª División",
}
const ROL_LABELS: Record<string, string> = {
  ARBITRO: "Árbitro", OFICIAL_MESA: "Mesa", ESTADISTICO: "Estadístico", RELATOR: "Relator",
}

function Avatar({ nombre, apellido, foto }: { nombre: string; apellido: string; foto: string | null }) {
  if (foto) return <img src={foto} alt={`${nombre} ${apellido}`} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-blue-600">{nombre[0]}{apellido[0]}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────

export default function HonorariosAdminPage() {
  const [data, setData] = useState<{ oficiales: OfficialSummary[]; totales: Totales } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<OfficialSummary | null>(null)
  const [detalle, setDetalle] = useState<RegistroDetalle[] | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/honorarios-propios")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  async function openDetalle(oficial: OfficialSummary) {
    setSelected(oficial)
    setDetalle(null)
    setLoadingDetalle(true)
    try {
      const r = await fetch(`/api/admin/honorarios-propios?userId=${oficial.usuarioId}`)
      const d = await r.json()
      setDetalle(d.registros ?? [])
    } catch {
      setDetalle([])
    } finally {
      setLoadingDetalle(false)
    }
  }

  const filteredOficiales = data?.oficiales.filter(o => {
    const q = search.toLowerCase()
    return !q || `${o.nombre} ${o.apellido}`.toLowerCase().includes(q) || o.email.toLowerCase().includes(q)
  }) ?? []

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400">Cargando honorarios…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Honorarios — Registro de oficiales</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resumen de lo cargado por cada oficial en su panel de honorarios propios.
        </p>
      </div>

      {/* Summary cards */}
      {data?.totales && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Users className="w-4 h-4 text-blue-600" />}
            label="Oficiales activos"
            value={String(data.totales.totalOficiales)}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<Banknote className="w-4 h-4 text-gray-600" />}
            label="Partidos cargados"
            value={String(data.totales.totalPartidos)}
            bg="bg-gray-50"
          />
          <StatCard
            icon={<Clock className="w-4 h-4 text-yellow-600" />}
            label="Total pendiente"
            value={formatCurrency(data.totales.totalPendiente)}
            bg="bg-yellow-50"
            highlight="text-yellow-700"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
            label="Total cobrado"
            value={formatCurrency(data.totales.totalPagado)}
            bg="bg-green-50"
            highlight="text-green-700"
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar oficial por nombre o email…"
          className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          style={{ fontSize: 16 }}
        />
      </div>

      {/* Officials table */}
      {filteredOficiales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-14 text-center">
          <Banknote className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">
            {search ? "Sin coincidencias." : "Ningún oficial ha registrado honorarios aún."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wide text-gray-400">
                  <th className="text-left px-4 py-3">Oficial</th>
                  <th className="text-center px-3 py-3">Partidos</th>
                  <th className="text-right px-3 py-3 text-yellow-600">Pendiente</th>
                  <th className="text-right px-3 py-3 text-green-600">Cobrado</th>
                  <th className="text-right px-3 py-3">Total</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOficiales.map(o => (
                  <tr
                    key={o.usuarioId}
                    onClick={() => openDetalle(o)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar nombre={o.nombre} apellido={o.apellido} foto={o.fotoCarnetUrl} />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{o.nombre} {o.apellido}</p>
                          <p className="text-[10px] text-gray-400 truncate">{o.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-gray-700">{o.totalPartidos}</span>
                      {o.partidosPendientes > 0 && (
                        <span className="ml-1.5 text-[9px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">
                          {o.partidosPendientes} pend.
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-yellow-700 tabular-nums">
                      {formatCurrency(o.totalPendiente)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-green-600 tabular-nums">
                      {formatCurrency(o.totalPagado)}
                    </td>
                    <td className="px-3 py-3 text-right font-black text-gray-900 tabular-nums">
                      {formatCurrency(o.totalGeneral)}
                    </td>
                    <td className="px-3 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer/modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelected(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl z-10 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Avatar nombre={selected.nombre} apellido={selected.apellido} foto={selected.fotoCarnetUrl} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{selected.nombre} {selected.apellido}</p>
                <p className="text-xs text-gray-400">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Modal stats */}
            <div className="grid grid-cols-3 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-0.5">Partidos</p>
                <p className="text-lg font-black text-gray-900">{selected.totalPartidos}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wide text-yellow-500 mb-0.5">Pendiente</p>
                <p className="text-lg font-black text-yellow-600">{formatCurrency(selected.totalPendiente)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wide text-green-500 mb-0.5">Cobrado</p>
                <p className="text-lg font-black text-green-600">{formatCurrency(selected.totalPagado)}</p>
              </div>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-5 py-3">
              {loadingDetalle ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : !detalle?.length ? (
                <p className="text-center text-sm text-gray-400 py-10">Sin registros.</p>
              ) : (
                <div className="space-y-2">
                  {detalle.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-900">{r.equipoA} vs {r.equipoB}</span>
                          <span className="text-[9px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                            {CATEGORIA_LABELS[r.categoria] ?? r.categoria}
                          </span>
                          <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                            {ROL_LABELS[r.rol] ?? r.rol}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatDate(r.fecha)}
                          {r.faseNombre && <span className="ml-1.5">· {r.faseNombre}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-gray-900 tabular-nums">{formatCurrency(Number(r.monto))}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.estado === "PAGADO" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                          {r.estado === "PAGADO" ? "Cobrado" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────

function StatCard({ icon, label, value, bg, highlight }: {
  icon: React.ReactNode; label: string; value: string; bg: string; highlight?: string
}) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">{label}</p>
      </div>
      <p className={`text-xl font-black tabular-nums ${highlight ?? "text-gray-900"}`}>{value}</p>
    </div>
  )
}
