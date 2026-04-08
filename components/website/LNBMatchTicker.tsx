"use client"

import type { NormalizedMatch } from "@/lib/programacion-lnb"

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
    <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.07] transition-colors group">
      {/* Live pulse */}
      {isLive && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block shrink-0" />
      )}

      {/* Home sigla */}
      <span className="text-[11px] font-bold text-white/85 uppercase tracking-wide">
        {m.homeSigla ?? m.homeName.slice(0, 3).toUpperCase()}
      </span>

      {/* Score / time */}
      <span className={`text-[11px] font-black tabular-nums ${isLive ? "text-red-400" : isComplete ? "text-white/50" : "text-blue-300"}`}>
        {(isLive || isComplete) && hasScore
          ? `${m.homeScore}–${m.awayScore}`
          : m.time
          ? m.time.slice(0, 5)
          : "--:--"}
      </span>

      {/* Away sigla */}
      <span className="text-[11px] font-bold text-white/85 uppercase tracking-wide">
        {m.awaySigla ?? m.awayName.slice(0, 3).toUpperCase()}
      </span>

      {/* Date for upcoming */}
      {!isLive && !isComplete && m.date && (
        <span className="text-[9px] text-white/30 ml-0.5 font-semibold">
          {fmtTickerDate(m.date)}
        </span>
      )}

      {/* Final label */}
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

export default function LNBMatchTicker({ matches }: { matches: NormalizedMatch[] }) {
  if (!matches.length) return null

  return (
    <div className="bg-[#0a1628] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex items-center overflow-x-auto py-1.5"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Brand label */}
          <div className="shrink-0 flex items-center gap-2 pr-4 mr-3 border-r border-white/10">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400">
              LNB 2026
            </span>
          </div>

          {/* Match pills */}
          {matches.map((m, i) => (
            <div key={m.id} className="flex items-center">
              {m.statsUrl ? (
                <a href={m.statsUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <TickerCard m={m} />
                </a>
              ) : (
                <TickerCard m={m} />
              )}
              {i < matches.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
