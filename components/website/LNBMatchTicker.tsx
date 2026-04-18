"use client"

import { startTransition, useEffect, useRef, useState } from "react"
import type { NormalizedMatch } from "@/lib/programacion-lnb"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function fmtTickerDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T00:00:00Z")
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

function TickerCard({ m }: { m: NormalizedMatch }) {
  const isLive = m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
  const isComplete = m.status === "COMPLETE"
  const hasScore = m.homeScore != null && m.awayScore != null

  return (
    <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.07] transition-colors whitespace-nowrap">
      {isLive && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block shrink-0" />
      )}
      <span className="text-[11px] font-bold text-white/85 uppercase tracking-wide">
        {m.homeSigla ?? m.homeName.slice(0, 3).toUpperCase()}
      </span>
      <span className={`text-[11px] font-black tabular-nums whitespace-nowrap ${isLive ? "text-red-400" : isComplete ? "text-white/50" : "text-blue-300"}`}>
        {(isLive || isComplete) && hasScore
          ? `${m.homeScore}–${m.awayScore}`
          : m.time
          ? m.time.slice(0, 5)
          : "--:--"}
      </span>
      <span className="text-[11px] font-bold text-white/85 uppercase tracking-wide">
        {m.awaySigla ?? m.awayName.slice(0, 3).toUpperCase()}
      </span>
      {!isLive && !isComplete && m.date && (
        <span className="text-[9px] text-white/30 ml-0.5 font-semibold">
          {fmtTickerDate(m.date)}
        </span>
      )}
      {isComplete && (
        <span className="text-[8px] font-black uppercase tracking-widest text-white/25 ml-0.5">
          Final
        </span>
      )}
    </div>
  )
}

function Separator() {
  return <span className="shrink-0 w-px h-4 bg-white/10 mx-1" />
}

export default function LNBMatchTicker({ matches: initialMatches }: { matches: NormalizedMatch[] }) {
  const [lnbMatches, setLnbMatches] = useState<NormalizedMatch[]>(initialMatches)
  const [lnbfMatches, setLnbfMatches] = useState<NormalizedMatch[] | null>(null)
  const [lnbfLoading, setLnbfLoading] = useState(false)
  const [activeLeague, setActiveLeague] = useState<"lnb" | "lnbf">("lnb")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-poll when LNB has live matches
  useEffect(() => {
    if (activeLeague !== "lnb") return
    const hasLive = lnbMatches.some(
      (m) => m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
    )
    if (!hasLive) return

    const refresh = () => {
      fetch("/api/website/programacion-lnb")
        .then((r) => r.json())
        .then((payload) => {
          if (Array.isArray(payload?.matches)) {
            const all: NormalizedMatch[] = payload.matches
            const live = all.filter(
              (m) => m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
            )
            const upcoming = all
              .filter((m) => m.status !== "COMPLETE" && !live.includes(m))
              .sort((a, b) => (a.isoDateTime ?? "").localeCompare(b.isoDateTime ?? ""))
            const recent = all.filter((m) => m.status === "COMPLETE").slice(-4)
            startTransition(() => {
              setLnbMatches([...recent, ...live, ...upcoming].slice(0, 20))
            })
          }
        })
        .catch(() => {})
    }

    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [activeLeague, lnbMatches])

  async function handleSelectLeague(key: "lnb" | "lnbf") {
    if (key === activeLeague) return
    if (key === "lnb") { setActiveLeague("lnb"); return }
    if (lnbfMatches !== null) { setActiveLeague("lnbf"); return }

    setLnbfLoading(true)
    try {
      const res = await fetch("/api/website/programacion-lnbf", { cache: "no-store" })
      const data = res.ok ? await res.json() : {}
      setLnbfMatches(Array.isArray(data.matches) ? data.matches : [])
    } catch {
      setLnbfMatches([])
    } finally {
      setLnbfLoading(false)
      setActiveLeague("lnbf")
    }
  }

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" })
  }

  const activeMatches = activeLeague === "lnb" ? lnbMatches : (lnbfMatches ?? [])

  if (!lnbMatches.length) return null

  return (
    <div className="bg-[#0a1628] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1">
          {/* Left arrow */}
          <button
            onClick={() => scroll("left")}
            className="shrink-0 flex items-center justify-center w-6 h-8 text-white/40 hover:text-white/80 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable strip */}
          <div
            ref={scrollRef}
            className="flex items-center flex-1 overflow-x-auto py-1.5 flex-nowrap"
            style={{ scrollbarWidth: "none" }}
          >
            {/* League toggle */}
            <div className="shrink-0 flex items-center gap-1 pr-3 mr-2 border-r border-white/10">
              <button
                onClick={() => handleSelectLeague("lnb")}
                className={`text-[10px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded transition-colors ${
                  activeLeague === "lnb"
                    ? "bg-blue-500/20 text-blue-300"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                LNB
              </button>
              <button
                onClick={() => handleSelectLeague("lnbf")}
                disabled={lnbfLoading}
                className={`text-[10px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded transition-colors ${
                  activeLeague === "lnbf"
                    ? "bg-rose-500/20 text-rose-300"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {lnbfLoading ? "···" : "LNBF"}
              </button>
            </div>

            {/* Match pills */}
            {activeMatches.length === 0 ? (
              <span className="text-[11px] text-white/30 px-2">Sin partidos programados</span>
            ) : (
              activeMatches.map((m, i) => (
                <div key={m.id} className="flex items-center">
                  {m.statsUrl ? (
                    <a href={m.statsUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <TickerCard m={m} />
                    </a>
                  ) : (
                    <TickerCard m={m} />
                  )}
                  {i < activeMatches.length - 1 && <Separator />}
                </div>
              ))
            )}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll("right")}
            className="shrink-0 flex items-center justify-center w-6 h-8 text-white/40 hover:text-white/80 transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
