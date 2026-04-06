"use client"

import { useState, useEffect } from "react"
import { Loader2, Calendar, Trophy, Clock, ChevronDown } from "lucide-react"

interface Competitor {
  competitorName: string
  competitorId: number
  score?: number
  images?: { logo?: { T1?: { url: string } } }
}

interface Match {
  matchId: number
  matchDate: string | null
  matchTime: string | null
  matchStatus: string
  competitors: Competitor[]
  venueName?: string
  roundName?: string
  roundNumber?: number
}

interface Competition {
  competitionId: number
  competitionName: string
  competitionNameInternational: string
  season: string
  year: number
  gender: string
  ageGroup: string
  standard: string
}

// Active competition IDs — update these as seasons change
const FEATURED_COMPETITIONS = [
  { id: 41089, name: "LNB Apertura 2025", color: "blue" },
  { id: 41368, name: "Liga Desarrollo Femenina 2025", color: "pink" },
  { id: 40886, name: "NAC U19M 2025", color: "emerald" },
  { id: 40895, name: "NAC U19F 2025", color: "purple" },
]

const statusLabels: Record<string, { label: string; class: string }> = {
  COMPLETE: { label: "Final", class: "bg-gray-100 text-gray-700" },
  LIVE: { label: "EN VIVO", class: "bg-red-500 text-white animate-pulse" },
  SCHEDULED: { label: "Programado", class: "bg-blue-100 text-blue-700" },
  POSTPONED: { label: "Aplazado", class: "bg-yellow-100 text-yellow-700" },
  CANCELLED: { label: "Cancelado", class: "bg-red-100 text-red-700" },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("es-PY", { weekday: "short", day: "numeric", month: "short" })
}

function MatchCard({ match }: { match: Match }) {
  const home = match.competitors?.[0]
  const away = match.competitors?.[1]
  const status = statusLabels[match.matchStatus] || statusLabels.SCHEDULED
  const isLive = match.matchStatus === "LIVE"
  const isComplete = match.matchStatus === "COMPLETE"

  return (
    <div className={`bg-white rounded-xl border ${isLive ? "border-red-200 ring-2 ring-red-100" : "border-gray-100"} p-4 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(match.matchDate)}</span>
          {match.matchTime && <span>· {match.matchTime.slice(0, 5)}</span>}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.class}`}>
          {status.label}
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {home?.images?.logo?.T1?.url ? (
              <img src={home.images.logo.T1.url} alt="" className="w-8 h-8 object-contain shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Trophy className="h-4 w-4 text-gray-300" />
              </div>
            )}
            <p className={`text-sm font-semibold truncate ${isComplete && home?.score !== undefined && away?.score !== undefined && home.score > away.score ? "text-gray-900" : "text-gray-700"}`}>
              {home?.competitorName || "Por definir"}
            </p>
          </div>
          {(isComplete || isLive) && (
            <p className={`text-xl font-bold tabular-nums ${isComplete && home?.score !== undefined && away?.score !== undefined && home.score > away.score ? "text-gray-900" : "text-gray-500"}`}>
              {home?.score ?? "-"}
            </p>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {away?.images?.logo?.T1?.url ? (
              <img src={away.images.logo.T1.url} alt="" className="w-8 h-8 object-contain shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Trophy className="h-4 w-4 text-gray-300" />
              </div>
            )}
            <p className={`text-sm font-semibold truncate ${isComplete && home?.score !== undefined && away?.score !== undefined && away.score > home.score ? "text-gray-900" : "text-gray-700"}`}>
              {away?.competitorName || "Por definir"}
            </p>
          </div>
          {(isComplete || isLive) && (
            <p className={`text-xl font-bold tabular-nums ${isComplete && home?.score !== undefined && away?.score !== undefined && away.score > home.score ? "text-gray-900" : "text-gray-500"}`}>
              {away?.score ?? "-"}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      {(match.venueName || match.roundName) && (
        <div className="mt-3 pt-2 border-t border-gray-50 flex items-center gap-2 text-[10px] text-gray-400">
          {match.roundName && <span>Fecha {match.roundNumber || match.roundName}</span>}
          {match.venueName && <span>· {match.venueName}</span>}
        </div>
      )}
    </div>
  )
}

export default function PartidosClient() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedComp, setSelectedComp] = useState<number>(FEATURED_COMPETITIONS[0].id)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  // Load competitions once
  useEffect(() => {
    fetch("/api/genius/competitions")
      .then(r => r.json())
      .then(data => {
        if (data?.data) setCompetitions(data.data)
      })
      .catch(() => {})
  }, [])

  // Load matches when competition changes
  useEffect(() => {
    setLoading(true)
    setShowAll(false)
    fetch(`/api/genius/matches?competitionId=${selectedComp}`)
      .then(r => r.json())
      .then(data => {
        const matchList: Match[] = data?.data || []
        // Sort: live first, then by date descending (most recent first)
        matchList.sort((a, b) => {
          if (a.matchStatus === "LIVE" && b.matchStatus !== "LIVE") return -1
          if (b.matchStatus === "LIVE" && a.matchStatus !== "LIVE") return 1
          const dateA = a.matchDate || ""
          const dateB = b.matchDate || ""
          return dateB.localeCompare(dateA)
        })
        setMatches(matchList)
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [selectedComp])

  // Split matches into upcoming and completed
  const liveMatches = matches.filter(m => m.matchStatus === "LIVE")
  const upcoming = matches.filter(m => m.matchStatus !== "COMPLETE" && m.matchStatus !== "LIVE")
  const completed = matches.filter(m => m.matchStatus === "COMPLETE")
  const displayedCompleted = showAll ? completed : completed.slice(0, 6)

  // Auto-refresh if there are live matches
  useEffect(() => {
    if (liveMatches.length === 0) return
    const interval = setInterval(() => {
      fetch(`/api/genius/matches?competitionId=${selectedComp}`)
        .then(r => r.json())
        .then(data => {
          const matchList: Match[] = data?.data || []
          matchList.sort((a, b) => {
            if (a.matchStatus === "LIVE" && b.matchStatus !== "LIVE") return -1
            if (b.matchStatus === "LIVE" && a.matchStatus !== "LIVE") return 1
            return (b.matchDate || "").localeCompare(a.matchDate || "")
          })
          setMatches(matchList)
        })
        .catch(() => {})
    }, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [liveMatches.length, selectedComp])

  const selectedCompInfo = FEATURED_COMPETITIONS.find(c => c.id === selectedComp)

  return (
    <div>
      {/* Competition selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FEATURED_COMPETITIONS.map(comp => (
          <button
            key={comp.id}
            onClick={() => setSelectedComp(comp.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedComp === comp.id
                ? comp.color === "blue" ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : comp.color === "pink" ? "bg-pink-600 text-white shadow-lg shadow-pink-200"
                : comp.color === "emerald" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                : "bg-purple-600 text-white shadow-lg shadow-purple-200"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {comp.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Cargando partidos...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="py-16 text-center">
          <Trophy className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hay partidos disponibles para esta competencia</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live matches */}
          {liveMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-lg font-bold text-gray-900">En vivo</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {liveMatches.map(m => <MatchCard key={m.matchId} match={m} />)}
              </div>
            </div>
          )}

          {/* Upcoming matches */}
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-900">Próximos partidos</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcoming.map(m => <MatchCard key={m.matchId} match={m} />)}
              </div>
            </div>
          )}

          {/* Completed matches */}
          {completed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900">Resultados</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedCompleted.map(m => <MatchCard key={m.matchId} match={m} />)}
              </div>
              {!showAll && completed.length > 6 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowAll(true)}
                    className="inline-flex items-center gap-1 px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Ver todos los resultados ({completed.length})
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
