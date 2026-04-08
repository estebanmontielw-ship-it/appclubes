"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Trophy, Calendar, BarChart3, Users, ChevronRight, Loader2, RefreshCw, ChevronDown } from "lucide-react"

interface Competition {
  competitionId: number
  competitionName: string
  competitionNameInternational: string
  season: string
  year: number
  gender: string
  ageGroup: string
  standard: string
  startDate: string | null
  endDate: string | null
  numberCompetitors: number
  images?: { logo?: { L1?: { url: string } } }
}

export default function GeniusSportsAdminPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedComp, setSelectedComp] = useState<number | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailType, setDetailType] = useState<"matches" | "standings" | "teams">("matches")
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadCompetitions()
  }, [])

  async function loadCompetitions() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/genius/explore")
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Error cargando competencias")
      const raw = json.data
      const comps: Competition[] = raw?.response?.data || raw?.data || (Array.isArray(raw) ? raw : [])
      comps.sort((a, b) => a.competitionName.localeCompare(b.competitionName))
      setCompetitions(comps)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(compId: number, type: "matches" | "standings" | "teams") {
    setSelectedComp(compId)
    setDetailType(type)
    setDetailLoading(true)
    setDetail(null)
    try {
      let path = ""
      if (type === "matches") path = `/competitions/${compId}/matches?limit=50`
      else if (type === "standings") path = `/competitions/${compId}/standings`
      else if (type === "teams") path = `/competitions/${compId}/teams?limit=50`

      const res = await fetch(`/api/genius/explore?path=${encodeURIComponent(path)}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Error cargando datos")
      const raw = json.data
      const items = raw?.response?.data || raw?.data || (Array.isArray(raw) ? raw : [])
      setDetail({ data: Array.isArray(items) ? items : [] })
    } catch (e: any) {
      setDetail({ error: e.message })
    } finally {
      setDetailLoading(false)
    }
  }

  // Get all available years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(competitions.map(c => c.year || 0))).filter(y => y > 0)
    return years.sort((a, b) => b - a)
  }, [competitions])

  // Filter by selected year + search
  const filtered = useMemo(() => {
    return competitions.filter(c => {
      if (c.year !== selectedYear) return false
      if (!search) return true
      const q = search.toLowerCase()
      return c.competitionName.toLowerCase().includes(q) ||
        c.competitionNameInternational?.toLowerCase().includes(q)
    })
  }, [competitions, selectedYear, search])

  const selectedCompData = competitions.find(c => c.competitionId === selectedComp)

  const genderBadge = (g: string) => {
    if (g === "MALE") return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">M</span>
    if (g === "FEMALE") return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-100 text-pink-700">F</span>
    return null
  }

  const ageBadge = (a: string) => {
    if (a === "SENIOR") return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">Senior</span>
    if (a === "JUNIOR") return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Junior</span>
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">{a}</span>
  }

  const standardBadge = (s: string) => {
    if (s === "ELITE") return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">Elite</span>
    if (s === "GRASS_ROOTS") return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">Base</span>
    return null
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Genius Sports API</h1>
          <p className="text-sm text-gray-500 mt-1">Explorador de datos de la API de FIBA/Genius Sports</p>
        </div>
        <button onClick={loadCompetitions} disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Recargar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
      )}

      {/* Year selector + Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={selectedYear}
            onChange={e => { setSelectedYear(Number(e.target.value)); setSelectedComp(null); setDetail(null) }}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>Temporada {year}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar competencia... (ej: LNB, U19)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-3">
          {filtered.length} competencia{filtered.length !== 1 ? "s" : ""} en {selectedYear}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Competitions list */}
        <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando competencias...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              No se encontraron competencias en {selectedYear}
            </div>
          ) : filtered.map(comp => (
            <div
              key={comp.competitionId}
              className={`bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md ${selectedComp === comp.competitionId ? "border-primary ring-2 ring-primary/20" : "border-gray-100"}`}
              onClick={() => loadDetail(comp.competitionId, "matches")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{comp.competitionName}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {genderBadge(comp.gender)}
                    {ageBadge(comp.ageGroup)}
                    {standardBadge(comp.standard)}
                    <span className="text-[10px] text-gray-400">ID: {comp.competitionId}</span>
                  </div>
                  {comp.startDate && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {comp.startDate}{comp.endDate ? ` → ${comp.endDate}` : ""}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-4 self-start">
          {selectedComp ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Selected competition header */}
              {selectedCompData && (
                <div className="px-4 pt-3 pb-2 border-b border-gray-50">
                  <p className="font-bold text-sm text-gray-900">{selectedCompData.competitionName}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {genderBadge(selectedCompData.gender)}
                    {ageBadge(selectedCompData.ageGroup)}
                    {standardBadge(selectedCompData.standard)}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {(["matches", "standings", "teams"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => loadDetail(selectedComp, type)}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${detailType === type ? "text-primary border-b-2 border-primary bg-primary/5" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {type === "matches" && <Calendar className="h-3.5 w-3.5" />}
                    {type === "standings" && <BarChart3 className="h-3.5 w-3.5" />}
                    {type === "teams" && <Users className="h-3.5 w-3.5" />}
                    {type === "matches" ? "Partidos" : type === "standings" ? "Posiciones" : "Equipos"}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {detailLoading ? (
                  <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                  </div>
                ) : detail?.error ? (
                  <div className="py-4 text-center text-red-500 text-sm">{detail.error}</div>
                ) : detail ? (
                  <div>
                    {/* Match list */}
                    {detailType === "matches" && detail.data && (
                      <div className="space-y-1.5">
                        {detail.data.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin partidos cargados</p>}
                        {(() => {
                          // Derive jornada + parse each match using Genius Sports field rules
                          const numTeams = new Set(
                            detail.data.flatMap((m: any) => (m.competitors || []).map((c: any) => c.competitorId))
                          ).size || 8
                          const matchesPerJornada = Math.max(1, Math.floor(numTeams / 2))

                          return detail.data.map((m: any) => {
                            // ── Date/time: everything is in matchTime "YYYY-MM-DD HH:MM:SS" ──
                            const raw = m.matchTime ?? m.matchDate ?? ""
                            const sep = raw.includes("T") ? "T" : raw.includes(" ") ? " " : null
                            const dateStr = sep ? raw.split(sep)[0]?.slice(0, 10) : null
                            const timeStr = sep ? raw.split(sep)[1]?.slice(0, 5) : null
                            const dateLabel = dateStr
                              ? new Date(dateStr + "T00:00:00Z").toLocaleDateString("es-PY", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
                              : "Sin fecha"

                            // ── Home / Away: use isHomeCompetitor (1=local, 0=visitante) ──
                            const competitors: any[] = m.competitors || []
                            const home = competitors.find((c: any) => c.isHomeCompetitor === 1 || c.isHomeCompetitor === "1" || c.isHomeCompetitor === true) ?? competitors[0]
                            const away = competitors.find((c: any) => c.isHomeCompetitor === 0 || c.isHomeCompetitor === "0" || c.isHomeCompetitor === false) ?? competitors[1]

                            // ── Score: use scoreString ──
                            const parseScore = (c: any) => {
                              if (!c) return null
                              const s = c.scoreString ?? c.score ?? null
                              if (s == null || s === "") return null
                              const n = parseInt(String(s), 10)
                              return Number.isFinite(n) ? n : null
                            }
                            const homeScore = parseScore(home)
                            const awayScore = parseScore(away)

                            // ── Venue: handle both flat venueName and nested venue object ──
                            const venue = (() => {
                              if (typeof m.venueName === "string" && m.venueName.trim()) return m.venueName.trim()
                              if (m.venue && typeof m.venue === "object") {
                                const n = m.venue.venueName || m.venue.venueNickname || m.venue.name || null
                                const city = m.venue.locationName || m.venue.suburb || null
                                if (n && city && n !== city) return `${n} · ${city}`
                                return n || city || null
                              }
                              return null
                            })()

                            // ── Jornada from matchNumber ──
                            const seqNum = m.matchNumber ?? m.number ?? null
                            const jornada = seqNum ? Math.ceil(seqNum / matchesPerJornada) : null

                            const isComplete = m.matchStatus === "COMPLETE"
                            const isLive = ["LIVE", "STARTED", "IN_PROGRESS"].includes(m.matchStatus)

                            return (
                              <div key={m.matchId} className={`rounded-lg p-3 text-sm border ${isLive ? "bg-red-50 border-red-200" : isComplete ? "bg-gray-50 border-gray-100" : "bg-white border-gray-100"}`}>
                                {/* Top row */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {jornada && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">J{jornada}</span>}
                                    <span className="text-[11px] text-gray-500">{dateLabel}{timeStr ? ` · ${timeStr}` : ""}</span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    isComplete ? "bg-green-100 text-green-700" :
                                    isLive ? "bg-red-100 text-red-700 animate-pulse" :
                                    "bg-gray-100 text-gray-500"
                                  }`}>
                                    {isComplete ? "Final" : isLive ? "EN VIVO" : "Programado"}
                                  </span>
                                </div>

                                {/* Teams + score */}
                                <div className="flex items-center gap-2">
                                  {/* Home */}
                                  <div className="flex-1 text-right">
                                    <p className="font-bold text-gray-900 text-sm leading-tight">{home?.competitorName ?? "—"}</p>
                                    <p className="text-[10px] text-gray-400">{home?.teamCode ?? ""} · Local</p>
                                  </div>
                                  {/* Score or VS */}
                                  <div className="shrink-0 w-16 text-center">
                                    {(isComplete || isLive) && homeScore != null && awayScore != null ? (
                                      <div>
                                        <p className="text-base font-black text-gray-900 leading-none">{homeScore} – {awayScore}</p>
                                        {isComplete && <p className="text-[9px] text-gray-400 mt-0.5">FINAL</p>}
                                        {isLive && <p className="text-[9px] text-red-500 font-bold mt-0.5 animate-pulse">LIVE</p>}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-bold text-gray-300">VS</span>
                                    )}
                                  </div>
                                  {/* Away */}
                                  <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-sm leading-tight">{away?.competitorName ?? "—"}</p>
                                    <p className="text-[10px] text-gray-400">{away?.teamCode ?? ""} · Visitante</p>
                                  </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-1.5">
                                  {venue ? (
                                    <p className="text-[10px] text-gray-400 truncate">{venue}</p>
                                  ) : <span />}
                                  <p className="text-[10px] text-gray-300 shrink-0 ml-2">ID {m.matchId}</p>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )}

                    {/* Standings */}
                    {detailType === "standings" && (
                      <div>
                        {Array.isArray(detail.data) && detail.data.length > 0 ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b text-gray-500">
                                <th className="text-left py-2 font-medium">#</th>
                                <th className="text-left py-2 font-medium">Equipo</th>
                                <th className="text-center py-2 font-medium">PJ</th>
                                <th className="text-center py-2 font-medium">G</th>
                                <th className="text-center py-2 font-medium">P</th>
                                <th className="text-center py-2 font-medium">Pts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.data.map((row: any, i: number) => (
                                <tr key={i} className="border-b border-gray-50">
                                  <td className="py-1.5 font-semibold text-gray-400">{row.rank || i + 1}</td>
                                  <td className="py-1.5 font-semibold text-gray-900">{row.competitorName || row.teamName || "—"}</td>
                                  <td className="py-1.5 text-center text-gray-600">{row.matchesPlayed ?? row.played ?? "-"}</td>
                                  <td className="py-1.5 text-center text-gray-600">{row.wins ?? "-"}</td>
                                  <td className="py-1.5 text-center text-gray-600">{row.losses ?? "-"}</td>
                                  <td className="py-1.5 text-center font-bold text-gray-900">{row.points ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-4">Sin datos de posiciones</p>
                        )}
                      </div>
                    )}

                    {/* Teams */}
                    {detailType === "teams" && detail.data && (
                      <div className="space-y-1.5">
                        {detail.data.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin equipos cargados</p>}
                        {detail.data.map((t: any) => (
                          <div key={t.teamId || t.competitorId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            {t.images?.logo?.T1?.url ? (
                              <img src={t.images.logo.T1.url} alt="" className="w-8 h-8 object-contain" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                                <Trophy className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{t.competitorName || t.teamName}</p>
                              <p className="text-[10px] text-gray-400">ID: {t.teamId || t.competitorId}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Raw JSON fallback */}
                    {!detail.data && (
                      <pre className="text-[10px] bg-gray-50 rounded p-3 overflow-auto max-h-96">
                        {JSON.stringify(detail, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-sm">Seleccioná una competencia</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <Trophy className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Seleccioná una competencia para ver partidos, posiciones y equipos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
