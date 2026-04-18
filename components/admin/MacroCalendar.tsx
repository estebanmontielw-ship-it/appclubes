"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, X, MapPin } from "lucide-react"
import type { NormalizedMatch } from "@/lib/programacion-lnb"

type CompKey = "lnb" | "lnbf" | "u22m" | "u22f"
type ViewMode = "month" | "week"

const COMP_CONFIG: Record<CompKey, { label: string; endpoint: string; color: string }> = {
  lnb:  { label: "LNB",    endpoint: "/api/website/programacion-lnb",  color: "#ef4444" },
  lnbf: { label: "LNBF",   endpoint: "/api/website/programacion-lnbf", color: "#ec4899" },
  u22m: { label: "U22 M",  endpoint: "/api/website/programacion-u22m", color: "#3b82f6" },
  u22f: { label: "U22 F",  endpoint: "/api/website/programacion-u22f", color: "#a855f7" },
}

const ALL_COMPS: CompKey[] = ["lnb", "lnbf", "u22m", "u22f"]
const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

interface MatchEntry { comp: CompKey; match: NormalizedMatch }

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

function getMonthCells(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function getWeekDates(ref: Date): Date[] {
  const dow = ref.getDay()
  const sunday = new Date(ref)
  sunday.setDate(ref.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function DayPanel({
  dateStr,
  entries,
  onClose,
}: {
  dateStr: string
  entries: MatchEntry[]
  onClose: () => void
}) {
  const d = new Date(dateStr + "T12:00:00")
  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 200px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{WEEK_DAYS[d.getDay()]}</p>
            <p className="text-lg font-black text-gray-900">{d.getDate()} de {MONTHS_ES[d.getMonth()]}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Match list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-gray-400">Sin partidos este día</p>
              <p className="text-xs text-gray-300 mt-1">para las ligas activas</p>
            </div>
          ) : (
            entries.map(({ comp, match }, idx) => {
              const cfg = COMP_CONFIG[comp]
              const isComplete = match.status === "COMPLETE"
              const isLive = match.status === "STARTED" || match.status === "LIVE" || match.status === "IN_PROGRESS"
              const hasScore = match.homeScore != null && match.awayScore != null
              return (
                <div key={idx} className="rounded-xl border border-gray-100 overflow-hidden">
                  {/* League bar */}
                  <div className="px-3 py-1.5 flex items-center gap-2" style={{ backgroundColor: cfg.color + "18" }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                    <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.label}</span>
                    {isLive && <span className="ml-auto text-[9px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">EN VIVO</span>}
                    {isComplete && <span className="ml-auto text-[9px] font-bold text-gray-400 uppercase">Final</span>}
                  </div>
                  {/* Teams + score */}
                  <div className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {/* Home */}
                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        {match.homeLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={match.homeLogo} alt="" width={24} height={24} className="w-6 h-6 object-contain shrink-0" />
                        )}
                        <span className="text-xs font-bold text-gray-800 truncate">
                          {match.homeSigla ?? match.homeName.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                      {/* Center */}
                      <div className="shrink-0 text-center min-w-[52px]">
                        {(isLive || isComplete) && hasScore ? (
                          <span className={`text-sm font-black tabular-nums ${isLive ? "text-red-600" : "text-gray-800"}`}>
                            {match.homeScore}–{match.awayScore}
                          </span>
                        ) : (
                          <span className="text-xs font-black text-gray-700 tabular-nums">
                            {match.time?.slice(0, 5) ?? "--:--"}
                          </span>
                        )}
                      </div>
                      {/* Away */}
                      <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
                        <span className="text-xs font-bold text-gray-800 truncate text-right">
                          {match.awaySigla ?? match.awayName.slice(0, 3).toUpperCase()}
                        </span>
                        {match.awayLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={match.awayLogo} alt="" width={24} height={24} className="w-6 h-6 object-contain shrink-0" />
                        )}
                      </div>
                    </div>
                    {match.venue && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <MapPin className="h-3 w-3 text-gray-300 shrink-0" />
                        <span className="text-[10px] text-gray-400 truncate">{match.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default function MacroCalendar() {
  const today = new Date()
  const todayStr = toDateStr(today)

  const [allMatches, setAllMatches] = useState<Partial<Record<CompKey, NormalizedMatch[]>>>({})
  const [loading, setLoading] = useState(true)
  const [activeComps, setActiveComps] = useState<Set<CompKey>>(new Set(ALL_COMPS))
  const [view, setView] = useState<ViewMode>("month")
  const [refDate, setRefDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr)

  // Fetch all 4 competitions in parallel on mount
  useEffect(() => {
    Promise.all(
      ALL_COMPS.map(async (key) => {
        try {
          const res = await fetch(COMP_CONFIG[key].endpoint, { cache: "no-store" })
          const data = res.ok ? await res.json() : {}
          return [key, Array.isArray(data.matches) ? data.matches : []] as [CompKey, NormalizedMatch[]]
        } catch {
          return [key, []] as [CompKey, NormalizedMatch[]]
        }
      })
    ).then((results) => {
      setAllMatches(Object.fromEntries(results))
      setLoading(false)
    })
  }, [])

  // All active matches indexed by date
  const matchesByDate = useMemo(() => {
    const map = new Map<string, MatchEntry[]>()
    for (const comp of ALL_COMPS) {
      if (!activeComps.has(comp)) continue
      for (const match of (allMatches[comp] ?? [])) {
        if (!match.date) continue
        const arr = map.get(match.date) ?? []
        arr.push({ comp, match })
        map.set(match.date, arr)
      }
    }
    // Sort each day's matches by time
    for (const [, arr] of Array.from(map.entries())) {
      arr.sort((a, b) => (a.match.isoDateTime ?? "").localeCompare(b.match.isoDateTime ?? ""))
    }
    return map
  }, [allMatches, activeComps])

  const toggleComp = (key: CompKey) => {
    setActiveComps(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key) // always keep at least one
      } else {
        next.add(key)
      }
      return next
    })
  }

  const navigate = (dir: -1 | 1) => {
    if (view === "month") {
      setRefDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1))
    } else {
      setRefDate(d => { const nd = new Date(d); nd.setDate(d.getDate() + dir * 7); return nd })
    }
  }

  const goToday = () => {
    setRefDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(todayStr)
  }

  const monthCells = useMemo(() => getMonthCells(refDate.getFullYear(), refDate.getMonth()), [refDate])
  const weekDates = useMemo(() => getWeekDates(refDate), [refDate])

  const headerLabel = useMemo(() => {
    if (view === "month") return `${MONTHS_ES[refDate.getMonth()]} ${refDate.getFullYear()}`
    const days = getWeekDates(refDate)
    const first = days[0]; const last = days[6]
    if (first.getMonth() === last.getMonth())
      return `${first.getDate()}–${last.getDate()} ${MONTHS_ES[first.getMonth()]} ${first.getFullYear()}`
    return `${first.getDate()} ${MONTHS_ES[first.getMonth()]} – ${last.getDate()} ${MONTHS_ES[last.getMonth()]} ${last.getFullYear()}`
  }, [view, refDate])

  const selectedEntries = selectedDate ? (matchesByDate.get(selectedDate) ?? []) : []

  return (
    <div className="flex flex-col gap-4">
      {/* Top controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Competition toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ALL_COMPS.map(key => {
            const cfg = COMP_CONFIG[key]
            const active = activeComps.has(key)
            return (
              <button
                key={key}
                onClick={() => toggleComp(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  active ? "text-white border-transparent shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                }`}
                style={active ? { backgroundColor: cfg.color } : {}}
              >
                <span className={`w-2 h-2 rounded-full ${active ? "bg-white/60" : "bg-gray-300"}`} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1" />

        {/* View switch */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(["month", "week"] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {v === "month" ? "Mes" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* Calendar panel */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Calendar header (dark) */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#0a1628] text-white">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex-1 text-center text-sm font-bold">{headerLabel}</span>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="ml-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              Hoy
            </button>
          </div>

          {/* Weekday header row */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {WEEK_DAYS.map(day => (
              <div key={day} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
                <span className="text-sm">Cargando partidos...</span>
              </div>
            </div>
          ) : view === "month" ? (
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
              {monthCells.map((cell, i) => {
                if (!cell) return <div key={i} className="bg-gray-50/30 min-h-[88px]" />
                const dateStr = toDateStr(cell)
                const entries = matchesByDate.get(dateStr) ?? []
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate
                const isCurrentMonth = cell.getMonth() === refDate.getMonth()

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`relative min-h-[88px] p-1.5 text-left flex flex-col gap-0.5 transition-colors group ${
                      isSelected ? "bg-blue-50/60" : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Date number */}
                    <span className={`self-start flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold mb-0.5 transition-colors ${
                      isToday
                        ? "bg-[#0a1628] text-white"
                        : isSelected
                        ? "bg-blue-500 text-white"
                        : isCurrentMonth
                        ? "text-gray-700 group-hover:bg-gray-100"
                        : "text-gray-300"
                    }`}>
                      {cell.getDate()}
                    </span>

                    {/* Match pills — up to 3 */}
                    {entries.slice(0, 3).map((e, idx) => (
                      <div
                        key={idx}
                        className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-semibold leading-tight truncate"
                        style={{ backgroundColor: COMP_CONFIG[e.comp].color + "1a", color: COMP_CONFIG[e.comp].color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COMP_CONFIG[e.comp].color }} />
                        <span className="truncate">
                          {e.match.homeSigla ?? e.match.homeName.slice(0,3).toUpperCase()} vs {e.match.awaySigla ?? e.match.awayName.slice(0,3).toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {entries.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-semibold px-1">+{entries.length - 3} más</span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            /* Week view */
            <div className="grid grid-cols-7 divide-x divide-gray-100 min-h-[420px]">
              {weekDates.map(day => {
                const dateStr = toDateStr(day)
                const entries = matchesByDate.get(dateStr) ?? []
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`p-2 flex flex-col gap-1 text-left transition-colors ${
                      isSelected ? "bg-blue-50/60" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col items-center mb-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{WEEK_DAYS[day.getDay()]}</span>
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-black ${
                        isToday ? "bg-[#0a1628] text-white" : isSelected ? "bg-blue-500 text-white" : "text-gray-700"
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1 w-full">
                      {entries.map((e, idx) => (
                        <div
                          key={idx}
                          className="w-full rounded-lg px-1.5 py-1.5 text-[10px] leading-tight"
                          style={{ backgroundColor: COMP_CONFIG[e.comp].color + "15", color: COMP_CONFIG[e.comp].color }}
                        >
                          <div className="font-black text-[9px] uppercase mb-0.5">{COMP_CONFIG[e.comp].label}</div>
                          <div className="font-bold truncate">
                            {e.match.homeSigla ?? e.match.homeName.slice(0,3).toUpperCase()} — {e.match.awaySigla ?? e.match.awayName.slice(0,3).toUpperCase()}
                          </div>
                          {e.match.time && (
                            <div className="opacity-60 text-[9px] tabular-nums mt-0.5">{e.match.time.slice(0,5)}</div>
                          )}
                        </div>
                      ))}
                      {entries.length === 0 && (
                        <div className="text-center py-4">
                          <span className="text-[11px] text-gray-200">—</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        {selectedDate && (
          <DayPanel
            dateStr={selectedDate}
            entries={selectedEntries}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </div>

      {/* Legend summary */}
      <div className="flex items-center gap-4 text-[11px] text-gray-400 px-1">
        {ALL_COMPS.filter(k => activeComps.has(k)).map(key => {
          const total = (allMatches[key] ?? []).length
          return (
            <span key={key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COMP_CONFIG[key].color }} />
              <span style={{ color: COMP_CONFIG[key].color }} className="font-bold">{COMP_CONFIG[key].label}</span>
              <span>{total} partidos</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
