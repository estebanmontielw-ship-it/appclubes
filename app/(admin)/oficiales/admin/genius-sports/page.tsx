"use client"

import { useState, useEffect } from "react"
import { Search, Trophy, Calendar, BarChart3, Users, ChevronRight, Loader2, RefreshCw } from "lucide-react"

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
      // The explore endpoint returns { ok, data } where data is the raw API response
      // Raw API: { response: { meta }, data: [...] } or just { data: [...] }
      const raw = json.data
      const comps: Competition[] = raw?.data || (Array.isArray(raw) ? raw : [])
      // Sort by year descending, then name
      comps.sort((a, b) => (b.year || 0) - (a.year || 0) || a.competitionName.localeCompare(b.competitionName))
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
      // Normalize: the raw API wraps arrays in { data: [...] }
      const raw = json.data
      setDetail(raw?.data ? raw : { data: Array.isArray(raw) ? raw : [] })
    } catch (e: any) {
      setDetail({ error: e.message })
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = competitions.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.competitionName.toLowerCase().includes(q) ||
      c.competitionNameInternational?.toLowerCase().includes(q) ||
      c.season?.includes(q) ||
      String(c.year).includes(q)
  })

  // Group by year
  const grouped = filtered.reduce((acc, c) => {
    const year = c.year || 0
    if (!acc[year]) acc[year] = []
    acc[year].push(c)
    return acc
  }, {} as Record<number, Competition[]>)

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a)

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

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar competencia... (ej: LNB, U19, 2025)"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Competitions list */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando competencias...
            </div>
          ) : years.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No se encontraron competencias</div>
          ) : years.map(year => (
            <div key={year}>
              <h2 className="text-sm font-bold text-gray-900 mb-2 sticky top-0 bg-gray-50 py-1 z-10">
                Temporada {year}
                <span className="text-gray-400 font-normal ml-2">({grouped[year].length})</span>
              </h2>
              <div className="space-y-1.5">
                {grouped[year].map(comp => (
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
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-4 self-start">
          {selectedComp ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
              <div className="p-4 max-h-[70vh] overflow-y-auto">
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
                      <div className="space-y-2">
                        {detail.data.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin partidos</p>}
                        {detail.data.map((m: any) => (
                          <div key={m.matchId} className="bg-gray-50 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-400">
                                {m.matchDate ? new Date(m.matchDate).toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" }) : "Sin fecha"}
                                {m.matchTime ? ` · ${m.matchTime}` : ""}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                m.matchStatus === "COMPLETE" ? "bg-green-100 text-green-700" :
                                m.matchStatus === "LIVE" ? "bg-red-100 text-red-700 animate-pulse" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {m.matchStatus === "COMPLETE" ? "Finalizado" :
                                 m.matchStatus === "LIVE" ? "EN VIVO" :
                                 m.matchStatus || "Programado"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{m.competitors?.[0]?.competitorName || "Equipo 1"}</p>
                                <p className="font-semibold text-gray-900">{m.competitors?.[1]?.competitorName || "Equipo 2"}</p>
                              </div>
                              {m.matchStatus === "COMPLETE" && (
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">{m.competitors?.[0]?.score ?? "-"}</p>
                                  <p className="font-bold text-gray-900">{m.competitors?.[1]?.score ?? "-"}</p>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">ID: {m.matchId} · {m.venueName || ""}</p>
                          </div>
                        ))}
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
                          <div className="text-sm text-gray-400 text-center py-4">
                            <pre className="text-left text-[10px] bg-gray-50 rounded p-3 overflow-auto max-h-96">
                              {JSON.stringify(detail, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Teams */}
                    {detailType === "teams" && detail.data && (
                      <div className="space-y-1.5">
                        {detail.data.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin equipos</p>}
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
