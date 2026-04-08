"use client"

import Link from "next/link"
import { MapPin, ExternalLink } from "lucide-react"
import type { NormalizedMatch } from "@/lib/programacion-lnb"

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "Sin fecha"
  const d = new Date(dateStr + "T00:00:00Z")
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

function TeamLogo({ logo, name, sigla }: { logo: string | null; name: string; sigla: string | null }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
    )
  }
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center text-sm font-black text-gray-400">
      {sigla?.slice(0, 3) ?? name.slice(0, 3).toUpperCase()}
    </div>
  )
}

export default function LNBMatchCards({
  matches,
  nextMatchId,
}: {
  matches: NormalizedMatch[]
  nextMatchId: string | number | null
}) {
  if (!matches.length) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">
        No hay partidos disponibles en este momento.
      </div>
    )
  }

  // Group by jornada for date headers
  const byRound = new Map<number | string, NormalizedMatch[]>()
  for (const m of matches) {
    const key = m.round ?? "sin-jornada"
    const arr = byRound.get(key) ?? []
    arr.push(m)
    byRound.set(key, arr)
  }

  return (
    <div className="space-y-6">
      {Array.from(byRound.entries()).map(([round, roundMatches]) => (
        <div key={round}>
          {/* Jornada header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#0a1628]">
              {round === "sin-jornada" ? "Sin fecha" : (roundMatches[0]?.roundLabel ?? `Fecha ${round}`)}
            </span>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {fmtDate(roundMatches[0]?.date ?? null)}
            </span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roundMatches.map((match) => {
              const isComplete = match.status === "COMPLETE"
              const isLive = match.status === "STARTED" || match.status === "LIVE" || match.status === "IN_PROGRESS"
              const isNext = match.id === nextMatchId
              const homeWins = isComplete && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore

              const cardClass = isLive
                ? "bg-white rounded-xl border border-red-200 shadow-md shadow-red-100/60"
                : isComplete
                ? "bg-gray-50/70 rounded-xl border border-gray-100 shadow-sm"
                : "bg-white rounded-xl border border-gray-100 shadow-sm hover:border-[#0a1628]/20 hover:shadow-md transition-all"

              const inner = (
                <div className={`relative ${cardClass} p-4`}>
                  {/* Live badge */}
                  {isLive && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
                      EN VIVO
                    </div>
                  )}
                  {/* Próximo badge */}
                  {isNext && !isLive && !isComplete && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
                      Próximo
                    </div>
                  )}

                  {/* Teams row */}
                  <div className="flex items-center gap-2 mt-1">
                    {/* Home */}
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <TeamLogo logo={match.homeLogo} name={match.homeName} sigla={match.homeSigla} />
                      <div className="text-center">
                        <p className="text-[11px] font-black text-[#0a1628] uppercase leading-tight line-clamp-2">
                          {match.homeName}
                        </p>
                        {match.homeSigla && (
                          <p className="text-[9px] text-gray-400 font-bold">{match.homeSigla}</p>
                        )}
                      </div>
                    </div>

                    {/* Center: score or time */}
                    <div className="shrink-0 flex flex-col items-center gap-0.5 min-w-[60px]">
                      {isLive && match.homeScore != null && match.awayScore != null ? (
                        <>
                          <span className="text-[9px] font-black uppercase tracking-wider text-red-500">Live</span>
                          <span className="text-xl font-black text-[#0a1628]">{match.homeScore}–{match.awayScore}</span>
                        </>
                      ) : isComplete && match.homeScore != null && match.awayScore != null ? (
                        <>
                          <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Final</span>
                          <div className="flex items-center gap-1">
                            <span className={`text-xl font-black ${homeWins ? "text-[#0a1628]" : "text-gray-400"}`}>{match.homeScore}</span>
                            <span className="text-gray-300 font-black text-sm">–</span>
                            <span className={`text-xl font-black ${!homeWins ? "text-[#0a1628]" : "text-gray-400"}`}>{match.awayScore}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] text-gray-400 font-semibold">{fmtDate(match.date)}</span>
                          <span className="text-base font-black text-[#0a1628] tabular-nums">{match.time ?? "--:--"}</span>
                          <span className="text-[9px] text-gray-400">vs</span>
                        </>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <TeamLogo logo={match.awayLogo} name={match.awayName} sigla={match.awaySigla} />
                      <div className="text-center">
                        <p className="text-[11px] font-black text-[#0a1628] uppercase leading-tight line-clamp-2">
                          {match.awayName}
                        </p>
                        {match.awaySigla && (
                          <p className="text-[9px] text-gray-400 font-bold">{match.awaySigla}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer: venue + stats link */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                    {match.venue ? (
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-400 truncate">{match.venue}</span>
                      </div>
                    ) : <span />}
                    {match.statsUrl && (
                      <div className="flex items-center gap-1 shrink-0 ml-2 text-[10px] font-semibold text-primary">
                        <ExternalLink className="h-3 w-3" />
                        {isLive ? "Ver en vivo" : isComplete ? "Estadísticas" : "Live stats"}
                      </div>
                    )}
                  </div>
                </div>
              )

              return match.statsUrl ? (
                <a key={match.id} href={match.statsUrl} target="_blank" rel="noopener noreferrer" className="block">
                  {inner}
                </a>
              ) : (
                <div key={match.id}>{inner}</div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="text-center pt-2">
        <Link
          href="/programacionlnb"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Ver programación completa →
        </Link>
      </div>
    </div>
  )
}
