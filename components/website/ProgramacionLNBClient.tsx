"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Trophy, Users, Home as HomeIcon, Plane, LayoutGrid, Clock, MapPin } from "lucide-react"

export interface LnbTeam {
  id: string | number
  name: string
  sigla: string | null
  logo: string | null
}

export interface LnbMatch {
  id: string | number
  date: string | null
  time: string | null
  isoDateTime: string | null
  status: string
  homeId: string | number | null
  homeName: string
  homeSigla: string | null
  homeLogo: string | null
  homeScore: number | null
  awayId: string | number | null
  awayName: string
  awaySigla: string | null
  awayLogo: string | null
  awayScore: number | null
  venue: string | null
  round: number | null
  roundLabel: string
}

interface Props {
  competitionName: string
  teams: LnbTeam[]
  matches: LnbMatch[]
  updatedAt: string
}

type ViewMode = "general" | "fecha" | "club"
type ClubSide = "all" | "home" | "away"

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formatDate(dateStr: string | null): { day: string; month: string; weekday: string; full: string } {
  if (!dateStr) return { day: "--", month: "--", weekday: "--", full: "Sin fecha" }
  const d = new Date(dateStr + "T12:00:00")
  if (isNaN(d.getTime())) return { day: "--", month: "--", weekday: "--", full: "Sin fecha" }
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: MONTH_LABELS[d.getMonth()],
    weekday: DAY_LABELS[d.getDay()],
    full: `${DAY_LABELS[d.getDay()]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`,
  }
}

function groupByDate(matches: LnbMatch[]): Array<{ key: string; label: string; items: LnbMatch[] }> {
  const groups = new Map<string, LnbMatch[]>()
  for (const m of matches) {
    const key = m.date ?? "sin-fecha"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const f = formatDate(key === "sin-fecha" ? null : key)
      return { key, label: f.full, items }
    })
}

function TeamBadge({ name, sigla, logo, align = "left" }: { name: string; sigla: string | null; logo: string | null; align?: "left" | "right" }) {
  const rightAlign = align === "right"
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${rightAlign ? "flex-row-reverse text-right" : ""}`}>
      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name} className="w-full h-full object-contain p-1" />
        ) : (
          <span className="text-[10px] font-bold text-gray-400">{sigla || "?"}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-sm sm:text-base text-[#0a1628] leading-tight line-clamp-1">{name}</p>
        {sigla && <p className="text-[10px] sm:text-xs text-gray-400 font-semibold">{sigla}</p>}
      </div>
    </div>
  )
}

function MatchCard({ match }: { match: LnbMatch }) {
  const isComplete = match.status === "COMPLETE"
  const dateInfo = formatDate(match.date)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 sm:px-4 py-3 sm:py-4 hover:border-gray-200 transition-colors">
      {/* Layout: LOCAL (izq) · centro · VISITANTE (der) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <TeamBadge name={match.homeName} sigla={match.homeSigla} logo={match.homeLogo} align="left" />

        <div className="flex flex-col items-center shrink-0 min-w-[80px] sm:min-w-[100px]">
          {isComplete ? (
            <div className="text-lg sm:text-xl font-black text-[#0a1628] tabular-nums">
              {match.homeScore ?? "-"} <span className="text-gray-300 mx-1">:</span> {match.awayScore ?? "-"}
            </div>
          ) : (
            <>
              {match.date && (
                <div className="text-[10px] text-gray-400 font-semibold mb-0.5">
                  {dateInfo.weekday} {dateInfo.day} {dateInfo.month}
                </div>
              )}
              <div className="px-3 py-1.5 rounded-lg bg-[#0a1628] text-white text-xs sm:text-sm font-bold tabular-nums flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {match.time ?? "--:--"}
              </div>
            </>
          )}
          <div className="text-[10px] text-gray-400 mt-1 font-medium">vs</div>
        </div>

        <TeamBadge name={match.awayName} sigla={match.awaySigla} logo={match.awayLogo} align="right" />
      </div>

      {match.venue && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-medium">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-gray-400" />
          <span className="line-clamp-1">{match.venue}</span>
        </div>
      )}
    </div>
  )
}

function DateHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-2 first:mt-0">
      <div className="h-px bg-gray-200 flex-1" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-2">{label}</span>
      <div className="h-px bg-gray-200 flex-1" />
    </div>
  )
}

export default function ProgramacionLNBClient({ competitionName, teams, matches, updatedAt }: Props) {
  const [view, setView] = useState<ViewMode>("general")
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | number | null>(null)
  const [clubSide, setClubSide] = useState<ClubSide>("all")

  // Only show scheduled (not finished) matches by default for a clean "upcoming" feel.
  // Still include all matches if the user wants historical — but for a programación
  // page, focusing on non-finished is what the user asked for.
  const scheduledMatches = useMemo(() => matches.filter((m) => m.status !== "COMPLETE"), [matches])

  // Rounds that actually have matches (for the "Por fecha" filter buttons)
  const availableRounds = useMemo(() => {
    const rounds = new Set<number>()
    for (const m of scheduledMatches) {
      if (m.round != null) rounds.add(m.round)
    }
    return Array.from(rounds).sort((a, b) => a - b)
  }, [scheduledMatches])

  // When switching to "fecha" view the first time, auto-select the closest upcoming round
  function handleViewChange(next: ViewMode) {
    setView(next)
    if (next === "fecha" && selectedRound == null && availableRounds.length > 0) {
      const now = new Date().toISOString().slice(0, 10)
      const upcomingMatch = scheduledMatches.find((m) => m.date && m.date >= now && m.round != null)
      setSelectedRound(upcomingMatch?.round ?? availableRounds[0])
    }
    if (next === "club" && selectedTeamId == null && teams.length > 0) {
      setSelectedTeamId(teams[0].id)
    }
  }

  // Filtered list based on current view
  const filteredMatches = useMemo(() => {
    if (view === "general") return scheduledMatches
    if (view === "fecha") {
      if (selectedRound == null) return []
      return scheduledMatches.filter((m) => m.round === selectedRound)
    }
    // club view
    if (selectedTeamId == null) return []
    return scheduledMatches.filter((m) => {
      const isHome = String(m.homeId ?? m.homeName) === String(selectedTeamId)
      const isAway = String(m.awayId ?? m.awayName) === String(selectedTeamId)
      if (clubSide === "home") return isHome
      if (clubSide === "away") return isAway
      return isHome || isAway
    })
  }, [view, selectedRound, selectedTeamId, clubSide, scheduledMatches])

  const dateGroups = useMemo(() => groupByDate(filteredMatches), [filteredMatches])
  const selectedTeam = teams.find((t) => String(t.id) === String(selectedTeamId))

  const updatedLabel = useMemo(() => {
    try {
      const d = new Date(updatedAt)
      return `${DAY_LABELS[d.getDay()]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    } catch {
      return ""
    }
  }, [updatedAt])

  return (
    <div>
      {/* Brand header — this is what will look good in screenshots */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2544] to-[#0a1628] text-white p-6 sm:p-8 mb-6 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-blue-300 font-semibold mb-2">
            <Trophy className="h-3.5 w-3.5" />
            Confederación Paraguaya de Básquetbol
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl leading-none mb-2">
            <span className="text-white">Programación </span>
            <span className="text-red-500">LNB</span>
          </h1>
          <p className="text-sm text-blue-100/70 mb-4">{competitionName}</p>
          {updatedLabel && (
            <p className="text-[11px] text-blue-200/60 font-medium">Actualizado: {updatedLabel}</p>
          )}
        </div>
      </div>

      {/* View mode tabs */}
      <div className="mb-4 bg-white rounded-xl border border-gray-100 p-1.5 inline-flex w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => handleViewChange("general")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
            view === "general" ? "bg-[#0a1628] text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          General
        </button>
        <button
          onClick={() => handleViewChange("fecha")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
            view === "fecha" ? "bg-[#0a1628] text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Por fecha
        </button>
        <button
          onClick={() => handleViewChange("club")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
            view === "club" ? "bg-[#0a1628] text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Por club
        </button>
      </div>

      {/* Secondary filters per view */}
      {view === "fecha" && (
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4">
          <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2 px-1">Elegí la fecha</p>
          {availableRounds.length === 0 ? (
            <p className="text-sm text-gray-400 p-2">No hay fechas programadas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableRounds.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRound(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    selectedRound === r
                      ? "bg-[#0a1628] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Fecha {r}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "club" && (
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2 px-1">Elegí el club</p>
            {teams.length === 0 ? (
              <p className="text-sm text-gray-400 p-2">No hay clubes disponibles.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teams.map((t) => {
                  const isSelected = String(t.id) === String(selectedTeamId)
                  return (
                    <button
                      key={String(t.id)}
                      onClick={() => setSelectedTeamId(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                        isSelected
                          ? "bg-[#0a1628] text-white border-[#0a1628] shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center ${
                          isSelected ? "bg-white/10" : "bg-gray-100"
                        }`}
                      >
                        {t.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.logo} alt={t.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="text-[9px] font-bold">{t.sigla || "?"}</span>
                        )}
                      </span>
                      <span className="hidden sm:inline">{t.name}</span>
                      <span className="sm:hidden">{t.sigla || t.name.slice(0, 3).toUpperCase()}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedTeam && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2 px-1">Condición</p>
              <div className="inline-flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setClubSide("all")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    clubSide === "all" ? "bg-white text-[#0a1628] shadow-sm" : "text-gray-600"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setClubSide("home")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    clubSide === "home" ? "bg-white text-[#0a1628] shadow-sm" : "text-gray-600"
                  }`}
                >
                  <HomeIcon className="h-3 w-3" />
                  Local
                </button>
                <button
                  onClick={() => setClubSide("away")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    clubSide === "away" ? "bg-white text-[#0a1628] shadow-sm" : "text-gray-600"
                  }`}
                >
                  <Plane className="h-3 w-3" />
                  Visitante
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matches list */}
      <div>
        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm">No hay partidos programados con estos filtros.</p>
          </div>
        ) : (
          <>
            {dateGroups.map((g) => (
              <div key={g.key}>
                <DateHeader label={g.label} />
                <div className="space-y-2.5">
                  {g.items.map((m) => (
                    <MatchCard key={String(m.id)} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer signature — nice to have in screenshots */}
      <div className="mt-8 text-center text-[11px] text-gray-400 font-medium">
        cpb.com.py/programacionlnb · Datos oficiales vía Genius Sports
      </div>
    </div>
  )
}
