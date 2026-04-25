"use client"

import { startTransition, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { MapPin, ExternalLink } from "lucide-react"
import type { NormalizedMatch } from "@/lib/programacion-lnb"
import { useLiveMatchPolling, liveBadgeText } from "@/hooks/useLiveMatchPolling"

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
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name}
        width={64}
        height={64}
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

function MatchCard({ match, isNext }: { match: NormalizedMatch; isNext: boolean }) {
  const isComplete = match.status === "COMPLETE"
  const isLive = match.status === "STARTED" || match.status === "LIVE" || match.status === "IN_PROGRESS"
  const homeWins = isComplete && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore
  const matchTime = match.isoDateTime ? new Date(match.isoDateTime).getTime() : null
  const minsToStart = matchTime !== null ? (matchTime - Date.now()) / 60000 : null
  const isPreLive = !isLive && !isComplete && minsToStart !== null && minsToStart <= 30

  const live = useLiveMatchPolling(match.id, isLive, {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    period: match.livePeriod ?? null,
    clock: match.liveClock ?? null,
  })
  const homeScore = isLive ? live.homeScore : match.homeScore
  const awayScore = isLive ? live.awayScore : match.awayScore
  const liveBadge = isLive ? liveBadgeText(live) : null

  const cardClass = isLive
    ? "bg-white rounded-xl border border-red-200 shadow-md shadow-red-100/60"
    : isComplete
    ? "bg-gray-50/70 rounded-xl border border-gray-100 shadow-sm"
    : "bg-white rounded-xl border border-gray-100 shadow-sm hover:border-[#0a1628]/20 hover:shadow-md transition-all"

  const inner = (
    <div className={`relative ${cardClass} p-4`}>
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
          EN VIVO
        </div>
      )}
      {isNext && !isLive && !isComplete && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5">
          <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
          Próximo
        </div>
      )}

      <div className="flex items-center gap-2 mt-1">
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

        <div className="shrink-0 flex flex-col items-center gap-0.5 min-w-[60px]">
          {isLive && homeScore != null && awayScore != null ? (
            <>
              {liveBadge ? (
                <span className="text-[9px] font-black uppercase tracking-wider text-red-500 tabular-nums">{liveBadge}</span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-wider text-red-500">Live</span>
              )}
              <span className="text-xl font-black text-[#0a1628]">{homeScore}–{awayScore}</span>
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

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
        {match.venue ? (
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-[10px] text-gray-400 truncate">{match.venue}</span>
          </div>
        ) : <span />}
        {(isComplete || isLive || isPreLive) ? (
          match.statsUrl && (
            <div className={`flex items-center gap-1 shrink-0 ml-2 text-[10px] font-semibold ${isLive || isPreLive ? "text-red-600" : "text-blue-600"}`}>
              <ExternalLink className="h-3 w-3" />
              {isComplete ? "Estadísticas" : "Livestats"}
            </div>
          )
        ) : (
          <div className="flex items-center gap-1 shrink-0 ml-2 text-[10px] font-semibold text-gray-500">
            <ExternalLink className="h-3 w-3" />
            Previa
          </div>
        )}
      </div>
    </div>
  )

  if (isComplete || isLive || isPreLive) {
    return match.statsUrl ? (
      <a href={match.statsUrl} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>
    ) : (
      <div>{inner}</div>
    )
  }
  return (
    <Link href={`/partido/${match.id}`} className="block">{inner}</Link>
  )
}

function MatchGrid({
  matches,
  nextMatchId,
  liveCount,
}: {
  matches: NormalizedMatch[]
  nextMatchId: string | number | null
  liveCount: number
}) {
  const byRound = new Map<number | string, NormalizedMatch[]>()
  for (const m of matches) {
    const key = m.round ?? "sin-jornada"
    const arr = byRound.get(key) ?? []
    arr.push(m)
    byRound.set(key, arr)
  }

  return (
    <div className="space-y-6">
      {liveCount > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-red-700 text-sm font-bold">
            {liveCount === 1 ? "1 partido en curso" : `${liveCount} partidos en curso`}
          </span>
          <span className="text-red-400 text-xs">· actualizando en tiempo real</span>
        </div>
      )}
      {Array.from(byRound.entries()).map(([round, roundMatches]) => (
        <div key={round}>
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
            {roundMatches.map((match) => (
              <MatchCard key={match.id} match={match} isNext={match.id === nextMatchId} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LNBMatchCards({
  matches: initialMatches,
  nextMatchId: initialNextMatchId,
  lnbfMatches: initialLnbfMatches,
  lnbfNextMatchId: initialLnbfNextMatchId,
  initialLeague = "lnb",
}: {
  matches: NormalizedMatch[]
  nextMatchId: string | number | null
  lnbfMatches?: NormalizedMatch[]
  lnbfNextMatchId?: string | number | null
  initialLeague?: "lnb" | "lnbf"
}) {
  const [matches, setMatches] = useState<NormalizedMatch[]>(initialMatches)
  const [nextMatchId, setNextMatchId] = useState<string | number | null>(initialNextMatchId)
  const [liveCount, setLiveCount] = useState(0)
  const cancelRef = useRef(false)

  // LNBF lazy state — pre-populated from server when initialLeague === "lnbf"
  const [activeLeague, setActiveLeague] = useState<"lnb" | "lnbf">(initialLeague)
  const [lnbfMatches, setLnbfMatches] = useState<NormalizedMatch[] | null>(
    initialLnbfMatches && initialLnbfMatches.length > 0 ? initialLnbfMatches : null
  )
  const [lnbfNextMatchId, setLnbfNextMatchId] = useState<string | number | null>(initialLnbfNextMatchId ?? null)
  const [lnbfLoading, setLnbfLoading] = useState(false)

  // Poll LNB data only
  useEffect(() => {
    cancelRef.current = false

    const poll = async () => {
      if (cancelRef.current) return
      try {
        const res = await fetch("/api/website/programacion-lnb", { cache: "no-store" })
        if (!res.ok || cancelRef.current) return
        const data = await res.json()
        if (!Array.isArray(data.matches) || cancelRef.current) return

        const all = data.matches as NormalizedMatch[]
        const now = new Date().toISOString()

        const live = all.filter(
          (m) => m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
        )
        const upcoming = all
          .filter((m) => m.status !== "COMPLETE" && !live.some((l) => l.id === m.id))
          .sort((a, b) => (a.isoDateTime ?? "").localeCompare(b.isoDateTime ?? ""))

        const filtered = [...live, ...upcoming.slice(0, 8)]
        const next = upcoming.find((m) => m.isoDateTime && m.isoDateTime >= now)
        const nextId = next?.id ?? upcoming[0]?.id ?? null

        startTransition(() => {
          setMatches(filtered)
          setNextMatchId(nextId)
          setLiveCount(live.length)
        })
      } catch {
        // Silently ignore — keep showing current data
      }
    }

    const timer = setInterval(poll, 30_000)
    return () => {
      cancelRef.current = true
      clearInterval(timer)
    }
  }, [])

  async function handleSelectLeague(key: "lnb" | "lnbf") {
    if (key === activeLeague) return
    if (key === "lnb") { setActiveLeague("lnb"); return }
    if (lnbfMatches !== null) { setActiveLeague("lnbf"); return }

    setLnbfLoading(true)
    try {
      const res = await fetch("/api/website/programacion-lnbf", { cache: "no-store" })
      const data = res.ok ? await res.json() : {}
      const all: NormalizedMatch[] = Array.isArray(data.matches) ? data.matches : []
      const now = new Date().toISOString()
      const live = all.filter((m) => m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS")
      const upcoming = all
        .filter((m) => m.status !== "COMPLETE" && !live.some((l) => l.id === m.id))
        .sort((a, b) => (a.isoDateTime ?? "").localeCompare(b.isoDateTime ?? ""))
      const filtered = [...live, ...upcoming.slice(0, 8)]
      const next = upcoming.find((m) => m.isoDateTime && m.isoDateTime >= now)
      setLnbfMatches(filtered)
      setLnbfNextMatchId(next?.id ?? upcoming[0]?.id ?? null)
    } catch {
      setLnbfMatches([])
    } finally {
      setLnbfLoading(false)
      setActiveLeague("lnbf")
    }
  }

  const activeMatches = activeLeague === "lnb" ? matches : (lnbfMatches ?? [])
  const activeNextMatchId = activeLeague === "lnb" ? nextMatchId : lnbfNextMatchId
  const activeLiveCount = activeLeague === "lnb" ? liveCount : 0

  if (!matches.length && !(lnbfMatches?.length)) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">
        No hay partidos disponibles en este momento.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* League toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSelectLeague("lnb")}
          className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide transition-all border ${
            activeLeague === "lnb"
              ? "bg-[#0a1628] text-white border-[#0a1628] shadow-sm"
              : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-700"
          }`}
        >
          LNB
        </button>
        <button
          onClick={() => handleSelectLeague("lnbf")}
          disabled={lnbfLoading}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide transition-all border ${
            activeLeague === "lnbf"
              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
              : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-700"
          }`}
        >
          {lnbfLoading && (
            <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          )}
          LNBF
        </button>
      </div>

      {activeMatches.length === 0 && activeLeague === "lnbf" ? (
        <div className="py-12 text-center text-gray-400 text-sm">Sin partidos programados.</div>
      ) : (
        <MatchGrid matches={activeMatches} nextMatchId={activeNextMatchId} liveCount={activeLiveCount} />
      )}

      <div className="text-center pt-2">
        <Link
          href={activeLeague === "lnb" ? "/programacionlnb" : "/programacionlnb?comp=lnbf"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Ver programación completa →
        </Link>
      </div>
    </div>
  )
}
