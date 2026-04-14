"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Clock,
  AlertCircle, Users, CalendarDays, MapPin, Download,
} from "lucide-react"

interface MatchRow {
  matchId: string
  fecha: string
  hora: string
  equipoLocal: string
  equipoVisit: string
  cancha: string | null
  categoria: string
  planillaId: string | null
  estado: string | null
  asignados: number
  confirmadaEn: string | null
}

function formatFecha(fecha: string) {
  if (!fecha) return ""
  const [y, m, d] = fecha.split("-")
  return `${d}/${m}/${y}`
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().split("T")[0]
}

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

export default function DesignacionesPage() {
  const router = useRouter()
  const [fecha, setFecha] = useState<string>(todayStr())
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creando, setCreando] = useState<string | null>(null)

  const load = useCallback(async (f: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/designaciones?fecha=${f}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Error ${res.status}`)
        setMatches([])
        return
      }
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setMatches([])
        return
      }
      setMatches(data.matches || [])
    } catch (e: any) {
      setError(e.message || "Error de conexión")
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(fecha)
  }, [fecha, load])

  async function abrirPlanilla(match: MatchRow) {
    if (match.planillaId) {
      router.push(`/oficiales/admin/designaciones/${match.planillaId}`)
      return
    }

    // Create planilla first
    setCreando(match.matchId)
    try {
      const [fechaStr, horaStr] = [match.fecha, match.hora]
      const res = await fetch("/api/designaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.matchId,
          competicionId: "LNB",
          categoria: match.categoria,
          fecha: `${fechaStr}T${horaStr || "00:00"}:00.000Z`,
          horaStr: match.hora,
          equipoLocal: match.equipoLocal,
          equipoVisit: match.equipoVisit,
          cancha: match.cancha,
        }),
      })
      const data = await res.json()
      if (data.planilla?.id) {
        router.push(`/oficiales/admin/designaciones/${data.planilla.id}`)
      }
    } finally {
      setCreando(null)
    }
  }

  function estadoBadge(match: MatchRow) {
    if (!match.planillaId) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
          <Clock className="h-3.5 w-3.5" /> Sin planilla
        </span>
      )
    }
    if (match.estado === "CONFIRMADA") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
          <CheckCircle className="h-3.5 w-3.5" /> Confirmada
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
        <AlertCircle className="h-3.5 w-3.5" /> Borrador · {match.asignados}/6
      </span>
    )
  }

  const matchesFecha = matches.filter(m => m.fecha === fecha)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Designaciones LNB</h1>
          <p className="text-sm text-gray-500 mt-0.5">Planillas de árbitros y mesa</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/oficiales/admin/designaciones/exportar?fecha=${fecha}`}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </a>
          <button
            onClick={() => load(fecha)}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-3 mb-5 bg-white rounded-xl border border-gray-200 p-3">
        <button
          onClick={() => setFecha(addDays(fecha, -1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 text-center">
          <input
            type="date"
            value={fecha}
            onChange={e => e.target.value && setFecha(e.target.value)}
            className="text-base font-semibold text-gray-900 text-center bg-transparent border-none outline-none cursor-pointer"
          />
        </div>

        <button
          onClick={() => setFecha(addDays(fecha, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Summary */}
      {!loading && matchesFecha.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{matchesFecha.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Partidos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">
              {matchesFecha.filter(m => m.planillaId && m.estado !== "CONFIRMADA").length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">En borrador</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {matchesFecha.filter(m => m.estado === "CONFIRMADA").length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Confirmados</p>
          </div>
        </div>
      )}

      {/* Match list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-200" />
          <p className="font-medium text-red-600">Error al cargar partidos</p>
          <p className="text-sm mt-1 text-red-400">{error}</p>
          <button onClick={() => load(fecha)} className="mt-4 text-sm text-primary underline">Reintentar</button>
        </div>
      ) : matchesFecha.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No hay partidos para esta fecha</p>
          <p className="text-sm mt-1">Probá con otro día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matchesFecha.map(match => (
            <button
              key={match.matchId}
              onClick={() => abrirPlanilla(match)}
              disabled={creando === match.matchId}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-sm active:scale-[0.99] transition-all p-4 disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Hora */}
                  <p className="text-sm font-bold text-primary mb-1">{match.hora.slice(0, 5)}</p>
                  {/* Teams */}
                  <p className="font-semibold text-gray-900 text-sm leading-snug">
                    {match.equipoLocal}
                  </p>
                  <p className="text-xs text-gray-400 my-0.5">vs</p>
                  <p className="font-semibold text-gray-900 text-sm leading-snug">
                    {match.equipoVisit}
                  </p>
                  {/* Venue */}
                  {match.cancha && (
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                      <MapPin className="h-3 w-3" />
                      {match.cancha}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {estadoBadge(match)}
                  {match.planillaId && match.estado !== "CONFIRMADA" && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="h-3 w-3" />
                      {match.asignados}/6
                    </span>
                  )}
                  {creando === match.matchId && (
                    <span className="text-xs text-primary animate-pulse">Abriendo...</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
