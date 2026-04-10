"use client"

import { useEffect, useState, useCallback } from "react"
import { DollarSign, CheckCircle, Clock, ChevronRight } from "lucide-react"

interface Honorario {
  id: string
  monto: number | string
  montoIva: number | string | null
  montoTotal: number | string
  aplicaIva: boolean
  estado: string
  pagadoEn: string | null
  cobradoEn: string | null
  createdAt: string
  partido: { equipoLocal: string; equipoVisit: string; fecha: string; categoria: string }
  designacion: { rol: string; esManual: boolean }
}

const ROL_LABELS: Record<string, string> = {
  ARBITRO_PRINCIPAL:   "Árbitro Principal",
  ARBITRO_ASISTENTE_1: "Árbitro Asistente 1",
  ARBITRO_ASISTENTE_2: "Árbitro Asistente 2",
  MESA_ANOTADOR:       "Apuntador",
  MESA_CRONOMETRADOR:  "Cronómetro",
  MESA_OPERADOR_24S:   "Lanzamiento 24s",
  MESA_ASISTENTE:      "Relator",
  ESTADISTICO:         "Estadístico",
}

const CAT_LABELS: Record<string, string> = {
  PRIMERA_DIVISION: "LNB",
  FEMENINO:         "LNB Femenino",
  SEGUNDA_DIVISION: "Segunda División",
  U22: "U22", U18: "U18", U16: "U16", U14: "U14",
  ESPECIAL: "Especial",
}

function gs(n: number | string | null | undefined) {
  return `Gs. ${Number(n || 0).toLocaleString("es-PY")}`
}

function formatFechaMes(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-PY", {
    month: "long", year: "numeric",
  })
}

function formatFechaLarga(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-PY", {
    weekday: "short", day: "numeric", month: "short",
  })
}

function agruparPorMes(list: Honorario[]): { mes: string; items: Honorario[] }[] {
  const map = new Map<string, Honorario[]>()
  for (const h of list) {
    const mes = formatFechaMes(h.partido.fecha)
    if (!map.has(mes)) map.set(mes, [])
    map.get(mes)!.push(h)
  }
  return Array.from(map.entries()).map(([mes, items]) => ({ mes, items }))
}

function HonoCard({
  h,
  onCobrado,
}: {
  h: Honorario
  onCobrado: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const neto = Number(h.monto)
  const total = Number(h.montoTotal)
  const yaCobrado = !!h.cobradoEn
  const esPagado = h.estado === "PAGADO"

  async function marcarCobrado() {
    setLoading(true)
    try {
      const res = await fetch("/api/mis-honorarios/cobrado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ honorarioId: h.id }),
      })
      if (res.ok) onCobrado(h.id)
    } catch {}
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className={`h-1 ${esPagado ? (yaCobrado ? "bg-green-400" : "bg-blue-400") : "bg-yellow-300"}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Left: game info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">
                {CAT_LABELS[h.partido.categoria] || h.partido.categoria}
              </span>
              {h.designacion.esManual && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                  Manual
                </span>
              )}
            </div>
            <p className="font-bold text-gray-900 text-sm leading-tight">
              {h.partido.equipoLocal} <span className="font-normal text-gray-400 text-xs">vs</span> {h.partido.equipoVisit}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {formatFechaLarga(h.partido.fecha)}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {ROL_LABELS[h.designacion.rol] || h.designacion.rol}
            </p>
          </div>

          {/* Right: monto + status */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <p className="font-bold text-gray-900 text-base">{gs(total)}</p>
            {h.aplicaIva && (
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">
                Neto {gs(neto)} + IVA
              </span>
            )}
            {!esPagado && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                Pendiente
              </span>
            )}
            {esPagado && !yaCobrado && (
              <button
                onClick={marcarCobrado}
                disabled={loading}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300 transition-colors disabled:opacity-50"
              >
                {loading ? "..." : "Ya cobré ✓"}
              </button>
            )}
            {esPagado && yaCobrado && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Cobrado
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MisHonorariosPage() {
  const [honorarios, setHonorarios] = useState<Honorario[]>([])
  const [totalPendiente, setTotalPendiente] = useState(0)
  const [totalPagado, setTotalPagado] = useState(0)
  const [cobradoEsteAnio, setCobradoEsteAnio] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"pendientes" | "pagados" | "todos">("pendientes")

  const loadData = useCallback(() => {
    fetch("/api/mis-honorarios")
      .then(r => r.json())
      .then(d => {
        setHonorarios(d.honorarios || [])
        setTotalPendiente(Number(d.totalPendiente || 0))
        setTotalPagado(Number(d.totalPagado || 0))
        setCobradoEsteAnio(Number(d.cobradoEsteAnio || 0))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function handleCobrado(id: string) {
    setHonorarios(prev =>
      prev.map(h => h.id === id ? { ...h, cobradoEn: new Date().toISOString() } : h)
    )
  }

  const pendientes = honorarios.filter(h => h.estado === "PENDIENTE")
  const pagados    = honorarios.filter(h => h.estado === "PAGADO")
  const lista = tab === "pendientes" ? pendientes : tab === "pagados" ? pagados : honorarios
  const grupos = agruparPorMes(lista)

  const anio = new Date().getFullYear()

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mis honorarios</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tus cobros por designaciones</p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              <p className="text-xs text-gray-500 font-medium">Pendiente</p>
            </div>
            <p className="text-xl font-bold text-yellow-600">{gs(totalPendiente)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <p className="text-xs text-gray-500 font-medium">Cobrado {anio}</p>
            </div>
            <p className="text-xl font-bold text-green-600">{gs(cobradoEsteAnio)}</p>
          </div>
        </div>
      )}

      {/* Pagado total (smaller) */}
      {!loading && totalPagado > 0 && (
        <div className="bg-blue-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <p className="text-xs text-blue-700">Total pagado por CPB</p>
          <p className="text-sm font-bold text-blue-800">{gs(totalPagado)}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {(["pendientes", "pagados", "todos"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "pendientes" ? `Pendientes${pendientes.length > 0 ? ` (${pendientes.length})` : ""}` :
             t === "pagados"    ? `Pagados${pagados.length > 0 ? ` (${pagados.length})` : ""}` :
             "Todos"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-7 w-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500 text-sm">
            {tab === "pendientes" ? "No tenés honorarios pendientes" :
             tab === "pagados"    ? "No tenés honorarios pagados aún" :
             "No tenés honorarios registrados"}
          </p>
          {tab === "pendientes" && (
            <p className="text-xs text-gray-400 mt-1">
              Se generan automáticamente al confirmar una planilla
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6 pb-8">
          {grupos.map(({ mes, items }) => (
            <div key={mes}>
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase capitalize">
                  {mes}
                </p>
                <p className="text-xs font-semibold text-gray-500">
                  {gs(items.reduce((s, h) => s + Number(h.montoTotal), 0))}
                </p>
              </div>
              <div className="space-y-2.5">
                {items.map(h => (
                  <HonoCard key={h.id} h={h} onCobrado={handleCobrado} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
