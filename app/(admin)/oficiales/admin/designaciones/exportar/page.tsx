"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Printer, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface Posicion {
  campo: string
  label: string
  id: string | null
  nombre: string | null
}

interface PlanillaExport {
  id: string
  matchId: string
  fecha: string
  horaStr: string
  equipoLocal: string
  equipoVisit: string
  cancha: string | null
  estado: string
  obs: string | null
  posiciones: Posicion[]
  confirmadaEn: string | null
  confirmadoPorNombre: string | null
}

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

function ExportarContent() {
  const searchParams = useSearchParams()
  const initialFecha = searchParams.get("fecha") || todayStr()
  const [fecha, setFecha] = useState(initialFecha)
  const [planillas, setPlanillas] = useState<PlanillaExport[]>([])
  const [loading, setLoading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fecha) return
    setLoading(true)
    fetch(`/api/designaciones/export?fecha=${fecha}`)
      .then(r => r.json())
      .then(d => setPlanillas(d.planillas || []))
      .finally(() => setLoading(false))
  }, [fecha])

  function imprimir() {
    window.print()
  }

  const fechaDisplay = fecha
    ? new Date(fecha + "T12:00:00").toLocaleDateString("es-PY", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : ""

  const arbitros = (p: PlanillaExport) => p.posiciones.filter(pos => ["cc", "a1", "a2"].includes(pos.campo))
  const mesa = (p: PlanillaExport) => p.posiciones.filter(pos => ["ap", "cron", "lanz", "esta", "rela"].includes(pos.campo))

  return (
    <div>
      {/* Screen controls - hidden on print */}
      <div className="print:hidden">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/oficiales/admin/designaciones" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Exportar planillas</h1>
          <button
            onClick={imprimir}
            disabled={planillas.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-gray-600">Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={e => e.target.value && setFecha(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>

        {!loading && planillas.length === 0 && (
          <p className="text-center text-gray-400 py-12">No hay planillas para esta fecha</p>
        )}
      </div>

      {/* Print content */}
      <div ref={printRef} className="print:block">
        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Designación de Árbitros y Mesa</h1>
          <p className="text-base mt-1 capitalize">{fechaDisplay}</p>
          <hr className="mt-3 border-gray-400" />
        </div>

        {/* Screen header too */}
        {planillas.length > 0 && (
          <div className="print:hidden mb-2">
            <p className="text-sm text-gray-500 capitalize">{fechaDisplay} · {planillas.length} partido{planillas.length !== 1 ? "s" : ""}</p>
          </div>
        )}

        <div className="space-y-6 print:space-y-8">
          {planillas.map((p, idx) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden print:rounded-none print:border print:border-gray-400 print:break-inside-avoid"
            >
              {/* Game header */}
              <div className="bg-gray-50 print:bg-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg print:text-xl">{p.equipoLocal} vs {p.equipoVisit}</p>
                  <p className="text-sm text-gray-500 print:text-gray-700">
                    {p.horaStr.slice(0, 5)} hs{p.cancha ? ` · ${p.cancha}` : ""}
                  </p>
                </div>
                <div>
                  {p.estado === "CONFIRMADA" ? (
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full print:rounded print:border print:border-green-600">
                      CONFIRMADA
                    </span>
                  ) : (
                    <span className="text-xs font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full print:rounded print:border print:border-orange-500">
                      BORRADOR
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                {/* Árbitros */}
                <div>
                  <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2 print:text-gray-600">Árbitros</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {arbitros(p).map(pos => (
                        <tr key={pos.campo} className="border-b border-gray-100 print:border-gray-300">
                          <td className="py-1.5 pr-3 text-xs text-gray-500 font-medium w-28">{pos.label}</td>
                          <td className="py-1.5 font-semibold text-gray-900 print:font-bold">
                            {pos.nombre || <span className="text-gray-300 font-normal">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mesa */}
                <div>
                  <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2 print:text-gray-600">Mesa de Control</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {mesa(p).map(pos => (
                        <tr key={pos.campo} className="border-b border-gray-100 print:border-gray-300">
                          <td className="py-1.5 pr-3 text-xs text-gray-500 font-medium w-28">{pos.label}</td>
                          <td className="py-1.5 font-semibold text-gray-900 print:font-bold">
                            {pos.nombre || <span className="text-gray-300 font-normal">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {p.obs && (
                <div className="px-4 pb-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
                  <span className="font-semibold text-gray-600">Obs:</span> {p.obs}
                </div>
              )}

              {/* Signature area for print */}
              <div className="hidden print:grid grid-cols-3 gap-6 px-4 pb-4 pt-2">
                <div className="text-center">
                  <div className="border-b border-gray-400 mb-1 h-8" />
                  <p className="text-xs text-gray-500">Designador</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-400 mb-1 h-8" />
                  <p className="text-xs text-gray-500">Crew Chief</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-400 mb-1 h-8" />
                  <p className="text-xs text-gray-500">Recibido</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Print footer */}
        {planillas.length > 0 && (
          <div className="hidden print:block text-center mt-8 text-xs text-gray-400">
            <p>Confederación Paraguaya de Básquetbol · cpb.com.py</p>
            <p className="mt-1">Impreso: {new Date().toLocaleString("es-PY")}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExportarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>}>
      <ExportarContent />
    </Suspense>
  )
}
