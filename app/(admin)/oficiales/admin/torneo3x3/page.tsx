"use client"

import { useEffect, useState, useCallback } from "react"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, X, Download } from "lucide-react"
import * as XLSX from "xlsx"

interface Jugador {
  id: string
  nombre: string
  posicion: number
  fechaNac: string | null
  nroCi: string | null
  celular: string | null
  camiseta: string | null
}

interface Equipo {
  id: string
  nombre: string
  ciudad: string | null
  categoria: string
  jugadores: Jugador[]
  stats: { completos: number; total: number; listoParaCompetir: boolean }
}

function isSinRegistrar(j: Jugador) {
  return j.nombre.includes("sin registrar")
}

function hasRealName(j: Jugador) {
  return !!(j.nombre && !j.nombre.includes("sin registrar"))
}

function isComplete(j: Jugador) {
  return !!(hasRealName(j) && j.fechaNac && j.nroCi && j.celular && j.camiseta)
}

function exportToExcel(equipos: Equipo[]) {
  const wb = XLSX.utils.book_new()

  const categorias = ["Masculino Open", "Femenino Open"] as const

  for (const cat of categorias) {
    const rows: (string | number)[][] = []

    // Header row
    rows.push(["Equipo", "Ciudad", "#", "Nombre", "Fecha Nac.", "Nro CI", "Camiseta", "Celular", "Estado"])

    const catEquipos = equipos.filter(e => e.categoria === cat)
    for (const equipo of catEquipos) {
      const reales = equipo.jugadores.filter(hasRealName)
      for (const j of reales) {
        rows.push([
          equipo.nombre,
          equipo.ciudad || "",
          j.posicion,
          j.nombre,
          j.fechaNac || "",
          j.nroCi || "",
          j.camiseta || "",
          j.celular || "",
          isComplete(j) ? "Completo" : "Incompleto",
        ])
      }
      // Blank separator between teams
      rows.push(["", "", "", "", "", "", "", "", ""])
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Column widths
    ws["!cols"] = [
      { wch: 22 }, { wch: 16 }, { wch: 4 }, { wch: 36 },
      { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 12 },
    ]

    // Style header row bold (basic)
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1")
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
      if (cell) cell.s = { font: { bold: true } }
    }

    XLSX.utils.book_append_sheet(wb, ws, cat === "Masculino Open" ? "Masculino" : "Femenino")
  }

  XLSX.writeFile(wb, `torneo3x3-jugadores-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function StatusBadge({ stats }: { stats: Equipo["stats"] }) {
  if (stats.listoParaCompetir) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3" /> {stats.completos}/{stats.total}
      </span>
    )
  }
  if (stats.completos === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        <XCircle className="h-3 w-3" /> {stats.completos}/{stats.total}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
      <AlertCircle className="h-3 w-3" /> {stats.completos}/{stats.total}
    </span>
  )
}

function JugadorDetail({ j }: { j: Jugador }) {
  const completo = isComplete(j)
  if (isSinRegistrar(j)) {
    return (
      <div className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 opacity-40">
        <span className="text-xs text-gray-400 italic">Jugador {j.posicion} — sin registrar</span>
        {j.posicion === 4 && <span className="text-[10px] text-gray-400">(opcional)</span>}
      </div>
    )
  }

  return (
    <div className={`py-2.5 border-b border-gray-50 last:border-0 ${completo ? "" : "bg-yellow-50/50 -mx-4 px-4"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <span className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
              completo ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {j.posicion}
            </span>
            {j.nombre}
            {j.posicion === 4 && <span className="text-[10px] text-gray-400 font-normal">(opc.)</span>}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1.5 ml-6.5 text-xs text-gray-500">
            <span>
              <span className="font-medium text-gray-400">CI:</span> {j.nroCi || <em className="text-red-400">falta</em>}
            </span>
            <span>
              <span className="font-medium text-gray-400">Cam:</span> {j.camiseta || <em className="text-red-400">falta</em>}
            </span>
            <span>
              <span className="font-medium text-gray-400">Nac:</span> {j.fechaNac || <em className="text-red-400">falta</em>}
            </span>
            <span>
              <span className="font-medium text-gray-400">Tel:</span> {j.celular || <em className="text-red-400">falta</em>}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function EquipoModal({ equipo, onClose }: { equipo: Equipo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">{equipo.nombre}</h2>
            <p className="text-xs text-gray-500">{equipo.ciudad} · {equipo.categoria}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge stats={equipo.stats} />
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          {equipo.jugadores.map(j => <JugadorDetail key={j.id} j={j} />)}
        </div>
      </div>
    </div>
  )
}

export default function AdminTorneo3x3Page() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"Masculino Open" | "Femenino Open">("Masculino Open")
  const [selected, setSelected] = useState<Equipo | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/torneo3x3")
      const data = await res.json()
      setEquipos(data.equipos || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = equipos.filter(e => e.categoria === tab)
  const listos   = filtered.filter(e => e.stats.listoParaCompetir).length
  const total    = filtered.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Torneo 3x3</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Progreso de registro de jugadores</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(equipos)}
            disabled={loading || equipos.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-3xl font-black text-green-600">{listos}</p>
            <p className="text-xs text-gray-500 mt-1">Equipos listos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-3xl font-black text-yellow-500">{total - listos}</p>
            <p className="text-xs text-gray-500 mt-1">Incompletos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-3xl font-black text-gray-700">{total}</p>
            <p className="text-xs text-gray-500 mt-1">Total equipos</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {(["Masculino Open", "Femenino Open"] as const).map(cat => {
          const catEquipos = equipos.filter(e => e.categoria === cat)
          const catListos = catEquipos.filter(e => e.stats.listoParaCompetir).length
          return (
            <button
              key={cat}
              onClick={() => setTab(cat)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === cat ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {cat === "Masculino Open" ? "♂ Masculino" : "♀ Femenino"}
              {!loading && ` (${catListos}/${catEquipos.length})`}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Ciudad</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(e => (
                <tr
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{e.nombre}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{e.ciudad || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge stats={e.stats} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <EquipoModal equipo={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
