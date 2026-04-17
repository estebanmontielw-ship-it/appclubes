"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { CalendarDays, Trophy, Users, Home as HomeIcon, Plane, LayoutGrid, Clock, MapPin, BarChart2, Radio } from "lucide-react"

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
  statsUrl: string | null
  round: number | null
  roundLabel: string
}

interface Props {
  competitionName: string
  teams: LnbTeam[]
  matches: LnbMatch[]
  updatedAt: string
  /** How often to poll for updates in ms. Default 30000 */
  pollInterval?: number
  /** Show LNB / U22 Femenino competition toggle. Default false. */
  showCompetitionSwitch?: boolean
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

function MatchCard({ match, isNext }: { match: LnbMatch; isNext?: boolean }) {
  const isComplete = match.status === "COMPLETE"
  const isLive = match.status === "STARTED" || match.status === "LIVE" || match.status === "IN_PROGRESS"
  const dateInfo = formatDate(match.date)
  const matchTime = match.isoDateTime ? new Date(match.isoDateTime).getTime() : null
  const minsToStart = matchTime !== null ? (matchTime - Date.now()) / 60000 : null
  const isPreLive = !isLive && !isComplete && minsToStart !== null && minsToStart <= 30

  // Winner emphasis for completed matches
  const homeWins = isComplete && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore
  const awayWins = isComplete && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore

  // Card style by status
  const cardClass = isLive
    ? "bg-white rounded-xl border border-red-200 shadow-md shadow-red-100/50 px-3 sm:px-4 py-3 sm:py-4 transition-all overflow-hidden"
    : isComplete
    ? "bg-gray-50/60 rounded-xl border border-gray-100 shadow-sm px-3 sm:px-4 py-3 sm:py-4 transition-all overflow-hidden"
    : "bg-white rounded-xl border border-gray-100 shadow-sm px-3 sm:px-4 py-3 sm:py-4 hover:border-[#0a1628]/20 hover:shadow-md transition-all overflow-hidden"

  return (
    <div className={`relative ${cardClass}`}>
      {/* Live accent strip */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-xl" />
      )}

      {/* Próximo badge */}
      {isNext && !isLive && !isComplete && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5">
          <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
          Próximo
        </div>
      )}

      {/* Layout: LOCAL (izq) · centro · VISITANTE (der) */}
      <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 ${isLive ? "mt-1" : ""}`}>
        <TeamBadge name={match.homeName} sigla={match.homeSigla} logo={match.homeLogo} align="left" />

        <div className="flex flex-col items-center shrink-0 min-w-[80px] sm:min-w-[105px]">
          {isComplete ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">Final</span>
              <div className="flex items-center tabular-nums leading-none">
                <span className={`text-2xl sm:text-3xl font-black ${homeWins ? "text-[#0a1628]" : "text-gray-400"}`}>
                  {match.homeScore ?? "-"}
                </span>
                <span className="text-gray-200 mx-1.5 text-xl">–</span>
                <span className={`text-2xl sm:text-3xl font-black ${awayWins ? "text-[#0a1628]" : "text-gray-400"}`}>
                  {match.awayScore ?? "-"}
                </span>
              </div>
            </div>
          ) : isLive ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-black uppercase tracking-wider">
                <Radio className="h-3 w-3 animate-pulse" />
                En vivo
              </div>
              {(match.homeScore != null || match.awayScore != null) && (
                <div className="flex items-center tabular-nums leading-none">
                  <span className="text-2xl font-black text-red-600">{match.homeScore ?? "-"}</span>
                  <span className="text-gray-300 mx-1.5 text-xl">–</span>
                  <span className="text-2xl font-black text-red-600">{match.awayScore ?? "-"}</span>
                </div>
              )}
              {match.time && (
                <div className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold tabular-nums">
                  {match.time}
                </div>
              )}
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

      {(match.venue || match.statsUrl) && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
          {match.venue ? (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium min-w-0">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-gray-400" />
              <span className="line-clamp-1">{match.venue}</span>
            </div>
          ) : <div />}
          {isComplete || isLive || isPreLive ? (
            match.statsUrl && (
              <a
                href={match.statsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors ${
                  isLive || isPreLive
                    ? "bg-red-50 hover:bg-red-100 text-red-700"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                }`}
              >
                <BarChart2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {isComplete ? "Estadísticas" : "Livestats"}
              </a>
            )
          ) : (
            <Link
              href={`/partido/${match.id}`}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <BarChart2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Previa
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function DateHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-3 first:mt-0">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-black uppercase tracking-wider text-[#0a1628]">{label}</span>
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 leading-none">
          {count} {count === 1 ? "partido" : "partidos"}
        </span>
      </div>
      <div className="h-px bg-gray-200 flex-1" />
    </div>
  )
}

export default function ProgramacionLNBClient({ competitionName, teams, matches: initialMatches, updatedAt: initialUpdatedAt, pollInterval = 30_000, showCompetitionSwitch = false }: Props) {
  // Live-polling state — overrides SSR-loaded data
  const [matches, setMatches] = useState<LnbMatch[]>(initialMatches)
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)
  const [isPolling, setIsPolling] = useState(false)
  const cancelRef = useRef(false)

  type CompKey = "lnb" | "lnbf" | "u22m" | "u22f"
  const COMP_TABS: { key: CompKey; label: string; endpoint: string; headerLabel: JSX.Element }[] = [
    { key: "lnb",  label: "LNB",          endpoint: "/api/website/programacion-lnb",  headerLabel: <><span className="text-white">Programación </span><span className="text-red-500">LNB</span></> },
    { key: "lnbf", label: "LNBF", endpoint: "/api/website/programacion-lnbf", headerLabel: <><span className="text-white">Programación </span><span className="text-rose-400">LNBF</span></> },
    { key: "u22m", label: "U22 Masc",     endpoint: "/api/website/programacion-u22m", headerLabel: <><span className="text-white">Programación </span><span className="text-blue-400">U22</span><span className="text-white text-2xl sm:text-3xl"> Masculino</span></> },
    { key: "u22f", label: "U22 Fem",      endpoint: "/api/website/programacion-u22f", headerLabel: <><span className="text-white">Programación </span><span className="text-rose-400">U22</span><span className="text-rose-300 text-2xl sm:text-3xl"> Femenino</span></> },
  ]

  // Competition switching
  const [activeComp, setActiveComp] = useState<CompKey>("lnb")
  const [compCache, setCompCache] = useState<Partial<Record<CompKey, { matches: LnbMatch[]; teams: LnbTeam[]; competitionName: string }>>>({})
  const [loadingComp, setLoadingComp] = useState<CompKey | null>(null)

  useEffect(() => {
    // Only poll for LNB — U22F has no live matches
    if (activeComp !== "lnb") return

    cancelRef.current = false
    let timer: ReturnType<typeof setInterval>

    const poll = async () => {
      if (cancelRef.current) return
      setIsPolling(true)
      try {
        const res = await fetch("/api/website/programacion-lnb", { cache: "no-store" })
        if (!res.ok || cancelRef.current) return
        const data = await res.json()
        if (Array.isArray(data.matches) && !cancelRef.current) {
          setMatches(data.matches)
          if (data.updatedAt) setUpdatedAt(data.updatedAt)
        }
      } catch {
        // Silently ignore network errors — keep showing current data
      } finally {
        if (!cancelRef.current) setIsPolling(false)
      }
    }

    timer = setInterval(poll, pollInterval)

    return () => {
      cancelRef.current = true
      clearInterval(timer)
    }
  }, [pollInterval, activeComp])

  // Only show live indicator when LNB is active
  const hasLive = activeComp === "lnb" && matches.some(
    (m) => m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
  )

  // Active competition data
  const activeMatches = activeComp === "lnb" ? matches : (compCache[activeComp]?.matches ?? [])
  const activeTeams = activeComp === "lnb" ? teams : (compCache[activeComp]?.teams ?? [])
  const activeCompName = activeComp === "lnb" ? competitionName : (compCache[activeComp]?.competitionName ?? COMP_TABS.find(t => t.key === activeComp)!.label)

  const [view, setView] = useState<ViewMode>("general")
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | number | null>(null)
  const [clubSide, setClubSide] = useState<ClubSide>("all")

  async function handleSelectCompetition(key: CompKey) {
    if (key === activeComp) return
    setView("general")
    setSelectedRound(null)
    setSelectedTeamId(null)
    setClubSide("all")
    if (key === "lnb") { setActiveComp("lnb"); return }
    if (compCache[key]) { setActiveComp(key); return }

    const tab = COMP_TABS.find(t => t.key === key)!
    setLoadingComp(key)
    try {
      const res = await fetch(tab.endpoint, { cache: "no-store" })
      const data = res.ok ? await res.json() : {}
      setCompCache(prev => ({
        ...prev,
        [key]: {
          matches: Array.isArray(data.matches) ? data.matches : [],
          teams: data.teams ?? [],
          competitionName: data.competition?.name ?? tab.label,
        },
      }))
    } catch {
      setCompCache(prev => ({ ...prev, [key]: { matches: [], teams: [], competitionName: tab.label } }))
    } finally {
      setLoadingComp(null)
      setActiveComp(key)
    }
  }

  // Show all matches — completed ones display the score, upcoming ones display time.
  const scheduledMatches = useMemo(() => activeMatches, [activeMatches])

  // Rounds that actually have matches (for the "Por jornada" filter buttons)
  const availableRounds = useMemo(() => {
    const rounds = new Set<number>()
    for (const m of scheduledMatches) {
      if (m.round != null) rounds.add(m.round)
    }
    return Array.from(rounds).sort((a, b) => a - b)
  }, [scheduledMatches])

  // Date range per round (for jornada buttons: "J2 · 16 Abr")
  const roundDateRange = useMemo(() => {
    const map = new Map<number, { from: string | null; to: string | null }>()
    for (const m of scheduledMatches) {
      if (m.round == null) continue
      const cur = map.get(m.round)
      const d = m.date
      if (!cur) { map.set(m.round, { from: d, to: d }); continue }
      if (d && (!cur.from || d < cur.from)) cur.from = d
      if (d && (!cur.to || d > cur.to)) cur.to = d
    }
    return map
  }, [scheduledMatches])

  // Next upcoming match ID (for "Próximo" badge)
  const nextMatchId = useMemo(() => {
    const now = new Date().toISOString().slice(0, 16) // "YYYY-MM-DDTHH:MM"
    const upcoming = scheduledMatches.find(
      (m) => m.status !== "COMPLETE" && m.isoDateTime && m.isoDateTime >= now
    )
    return upcoming?.id ?? null
  }, [scheduledMatches])

  // Format jornada date range label: "13 Abr" or "19–20 Abr"
  function formatJornadaRange(from: string | null, to: string | null): string {
    if (!from) return ""
    const f = formatDate(from)
    if (!to || from === to) return `${parseInt(f.day)} ${f.month}`
    const t = formatDate(to)
    if (f.month === t.month) return `${parseInt(f.day)}–${parseInt(t.day)} ${f.month}`
    return `${parseInt(f.day)} ${f.month}–${parseInt(t.day)} ${t.month}`
  }

  // When switching view the first time, auto-select the closest upcoming round/team
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
  const selectedTeam = activeTeams.find((t) => String(t.id) === String(selectedTeamId))
  const filteredMatches = useMemo(() => {
    if (view === "general") return scheduledMatches
    if (view === "fecha") {
      if (selectedRound == null) return []
      return scheduledMatches.filter((m) => m.round === selectedRound)
    }
    // club view
    if (selectedTeamId == null) return []
    const selectedName = selectedTeam?.name ?? ""
    return scheduledMatches.filter((m) => {
      const isHome =
        (m.homeId != null && String(m.homeId) === String(selectedTeamId)) ||
        m.homeName === selectedName
      const isAway =
        (m.awayId != null && String(m.awayId) === String(selectedTeamId)) ||
        m.awayName === selectedName
      if (clubSide === "home") return isHome
      if (clubSide === "away") return isAway
      return isHome || isAway
    })
  }, [view, selectedRound, selectedTeamId, clubSide, scheduledMatches, selectedTeam])

  const dateGroups = useMemo(() => groupByDate(filteredMatches), [filteredMatches])

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
      {/* Competition selector */}
      {showCompetitionSwitch && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {COMP_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleSelectCompetition(tab.key)}
              disabled={loadingComp === tab.key}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                activeComp === tab.key
                  ? "bg-[#0a1628] text-white border-[#0a1628] shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
              }`}
            >
              {loadingComp === tab.key && (
                <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Brand header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2544] to-[#0a1628] text-white p-6 sm:p-8 mb-6 shadow-lg">
        <div className={`absolute top-0 right-0 w-64 h-64 ${activeComp === "lnb" ? "bg-red-500/10" : "bg-rose-500/10"} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-blue-300 font-semibold mb-2">
            <Trophy className="h-3.5 w-3.5" />
            Confederación Paraguaya de Básquetbol
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl leading-none mb-2">
            {COMP_TABS.find(t => t.key === activeComp)!.headerLabel}
          </h1>
          <p className="text-sm text-blue-100/70 mb-4">{activeCompName}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {updatedLabel && (
              <p className="text-[11px] text-blue-200/60 font-medium flex items-center gap-1.5">
                {isPolling ? (
                  <span className="inline-block w-2.5 h-2.5 border border-blue-300/50 border-t-blue-300 rounded-full animate-spin" />
                ) : null}
                Actualizado: {updatedLabel}
              </p>
            )}
            {hasLive && (
              <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-400/40 rounded-full px-3 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-300 text-[11px] font-bold uppercase tracking-wider">Partido en curso · live</span>
              </div>
            )}
          </div>
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
          Por jornada
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
          <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2 px-1">Elegí la jornada</p>
          {availableRounds.length === 0 ? (
            <p className="text-sm text-gray-400 p-2">No hay fechas programadas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableRounds.map((r) => {
                const range = roundDateRange.get(r)
                const rangeLabel = range ? formatJornadaRange(range.from, range.to) : ""
                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRound(r)}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg font-bold transition-colors min-w-[3.5rem] ${
                      selectedRound === r
                        ? "bg-[#0a1628] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span className="text-sm leading-tight">J{r}</span>
                    {rangeLabel && (
                      <span className={`text-[9px] font-medium leading-tight mt-0.5 ${selectedRound === r ? "text-blue-200" : "text-gray-400"}`}>
                        {rangeLabel}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {view === "club" && (
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2 px-1">Elegí el club</p>
            {activeTeams.length === 0 ? (
              <p className="text-sm text-gray-400 p-2">No hay clubes disponibles.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeTeams.map((t) => {
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
            <p className="text-gray-400 text-sm">No hay partidos con estos filtros.</p>
          </div>
        ) : (
          <>
            {dateGroups.map((g) => (
              <div key={g.key}>
                <DateHeader label={g.label} count={g.items.length} />
                <div className="space-y-2.5">
                  {g.items.map((m) => (
                    <MatchCard
                      key={String(m.id)}
                      match={m}
                      isNext={activeComp === "lnb" && nextMatchId != null && String(m.id) === String(nextMatchId)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[11px] text-gray-400 font-medium">
        cpb.com.py/programacionlnb · Datos oficiales vía Genius Sports
      </div>
    </div>
  )
}
