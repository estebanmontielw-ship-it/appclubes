"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, MapPin, Calendar, Loader2, BarChart2,
  TrendingUp, Users, Activity, ExternalLink, Clock,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Standing {
  position: number | null
  gamesPlayed: number
  wins: number
  losses: number
  winPct: number | null
  pointsFor: number | null
  pointsAgainst: number | null
  pointDiff: number | null
}

interface FormResult {
  date: string | null
  myScore: number
  oppScore: number
  oppName: string
  oppSigla: string | null
  oppLogo: string | null
  isHome: boolean
  result: "W" | "L" | "E"
}

interface TopPlayer {
  personId: number
  name: string
  photoUrl: string | null
  teamLogo: string | null
  games: number
  ptsAvg: number
  rebAvg: number
  astAvg: number
  fgPct: number | null
}

interface TeamStats {
  ptsAvg: number; rebAvg: number; astAvg: number
  stlAvg: number; blkAvg: number; toAvg: number
  fgPct: number | null; threePtPct: number | null; ftPct: number | null
}

interface TeamPrevia {
  id: string | number
  name: string
  sigla: string | null
  logo: string | null
  standing: Standing | null
  recentForm: FormResult[]
  topPlayers: TopPlayer[]
  teamStats: TeamStats | null
}

interface H2HEntry {
  date: string | null
  season: number | null
  homeName: string; homeSigla: string | null; homeLogo: string | null; homeScore: number | null
  awayName: string; awaySigla: string | null; awayLogo: string | null; awayScore: number | null
}

interface PreviaData {
  match: {
    id: string | number
    date: string | null; time: string | null; isoDateTime: string | null
    status: string; venue: string | null; statsUrl: string | null
  }
  home: TeamPrevia
  away: TeamPrevia
  h2h: H2HEntry[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function fmtDate(d: string | null) {
  if (!d) return "Sin fecha"
  const dt = new Date(d + "T12:00:00")
  if (isNaN(dt.getTime())) return d
  return `${DAYS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`
}

function TeamLogo({ logo, name, size = 56 }: { logo: string | null; name: string; size?: number }) {
  if (logo) return <img src={logo} alt={name} style={{ width: size, height: size }} className="object-contain" />
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-300 text-sm">
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function FormBadge({ r }: { r: FormResult }) {
  const color = r.result === "W" ? "bg-green-500 text-white" : r.result === "L" ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-500"
  return (
    <div className={`group relative flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black cursor-default ${color}`}>
      {r.result}
      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-[#0a1628] text-white text-[9px] font-semibold rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
        {r.isHome ? "vs" : "@"} {r.oppSigla ?? r.oppName} {r.myScore}–{r.oppScore}
      </div>
    </div>
  )
}

function StatBar({ label, homeVal, awayVal, format = (v: number) => v.toFixed(1) }: {
  label: string; homeVal: number | null; awayVal: number | null; format?: (v: number) => string
}) {
  const hv = homeVal ?? 0
  const av = awayVal ?? 0
  const max = Math.max(hv, av, 1)
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1.5">
      <div className="flex items-center justify-end gap-2">
        <span className={`text-sm font-black tabular-nums ${hv >= av ? "text-[#0a1628]" : "text-gray-400"}`}>
          {homeVal != null ? format(hv) : "—"}
        </span>
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex justify-end">
          <div className={`h-full rounded-full ${hv >= av ? "bg-blue-500" : "bg-gray-300"}`} style={{ width: `${(hv / max) * 100}%` }} />
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-wide text-gray-400 w-14 text-center">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${av >= hv ? "bg-blue-500" : "bg-gray-300"}`} style={{ width: `${(av / max) * 100}%` }} />
        </div>
        <span className={`text-sm font-black tabular-nums ${av >= hv ? "text-[#0a1628]" : "text-gray-400"}`}>
          {awayVal != null ? format(av) : "—"}
        </span>
      </div>
    </div>
  )
}

// ─── Livestats button (client-side time check) ────────────────────────────────

function LivestatsButton({ isoDateTime, statsUrl, status }: {
  isoDateTime: string | null; statsUrl: string | null; status: string
}) {
  const [show, setShow] = useState(false)
  const [label, setLabel] = useState("Livestats")

  useEffect(() => {
    function check() {
      const isComplete = status === "COMPLETE"
      const isLive = status === "STARTED" || status === "LIVE" || status === "IN_PROGRESS"
      if (isComplete) { setLabel("Ver estadísticas"); setShow(true); return }
      if (isLive) { setLabel("Livestats · EN VIVO"); setShow(true); return }
      if (!isoDateTime) return
      const diff = (new Date(isoDateTime).getTime() - Date.now()) / 60000
      if (diff <= 30) { setLabel("Ver Livestats"); setShow(true) }
      else setShow(false)
    }
    check()
    const t = setInterval(check, 30_000)
    return () => clearInterval(t)
  }, [isoDateTime, status, statsUrl])

  if (!show || !statsUrl) return null

  const isLive = status === "STARTED" || status === "LIVE" || status === "IN_PROGRESS"
  return (
    <a href={statsUrl} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-colors ${isLive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-[#0a1628] hover:bg-[#1a2f4a] text-white"}`}>
      <ExternalLink className="w-4 h-4" />
      {label}
    </a>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PartidoPreviaPage({ params }: { params: { matchId: string } }) {
  const { matchId } = params
  const [data, setData] = useState<PreviaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/website/partido-previa?matchId=${matchId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError("No se pudo cargar la información del partido."))
      .finally(() => setLoading(false))
  }, [matchId])

  if (loading) return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400 font-semibold">Cargando previa…</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="text-center">
        <BarChart2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">{error ?? "Partido no encontrado."}</p>
        <Link href="/calendario" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al calendario
        </Link>
      </div>
    </div>
  )

  const { match, home, away, h2h } = data
  const isComplete = match.status === "COMPLETE"
  const isLive = match.status === "STARTED" || match.status === "LIVE" || match.status === "IN_PROGRESS"
  const homeWins = isComplete && (home.standing?.wins ?? 0) > (away.standing?.wins ?? 0)

  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        {/* Back */}
        <Link href="/calendario" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Calendario
        </Link>

        {/* Match header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLive && <div className="h-1 bg-red-500" />}
          <div className="p-5 sm:p-6">
            {/* Status badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {isLive ? (
                <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" /> EN VIVO
                </span>
              ) : isComplete ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-100 rounded-full px-3 py-1">Finalizado</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                  <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" /> Previa
                </span>
              )}
            </div>

            {/* Teams */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              {/* Home */}
              <div className="flex flex-col items-center gap-2 text-center">
                <TeamLogo logo={home.logo} name={home.name} size={64} />
                <div>
                  <p className="font-black text-sm sm:text-base text-[#0a1628] leading-tight uppercase">{home.name}</p>
                  {home.sigla && <p className="text-[10px] text-gray-400 font-bold">{home.sigla}</p>}
                </div>
              </div>

              {/* Score / Time */}
              <div className="flex flex-col items-center gap-1 min-w-[80px] sm:min-w-[100px]">
                {isComplete ? (
                  <>
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Final</span>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <span className={`text-3xl font-black ${homeWins ? "text-[#0a1628]" : "text-gray-400"}`}>{home.standing?.wins ?? "—"}</span>
                      {/* If scores available from match (we'd need to add them) */}
                    </div>
                  </>
                ) : isLive ? (
                  <span className="text-lg font-black text-red-600">LIVE</span>
                ) : (
                  <>
                    {match.date && <span className="text-[10px] text-gray-400 font-semibold">{fmtDate(match.date)}</span>}
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0a1628] text-white">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-black text-sm tabular-nums">{match.time ?? "--:--"}</span>
                    </div>
                  </>
                )}
                <span className="text-[10px] text-gray-400 mt-0.5">vs</span>
              </div>

              {/* Away */}
              <div className="flex flex-col items-center gap-2 text-center">
                <TeamLogo logo={away.logo} name={away.name} size={64} />
                <div>
                  <p className="font-black text-sm sm:text-base text-[#0a1628] leading-tight uppercase">{away.name}</p>
                  {away.sigla && <p className="text-[10px] text-gray-400 font-bold">{away.sigla}</p>}
                </div>
              </div>
            </div>

            {/* Venue */}
            {match.venue && (
              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {match.venue}
              </div>
            )}

            {/* Livestats button */}
            <div className="flex justify-center mt-4">
              <LivestatsButton isoDateTime={match.isoDateTime} statsUrl={match.statsUrl} status={match.status} />
            </div>
          </div>
        </div>

        {/* Standings comparison */}
        {(home.standing || away.standing) && (
          <Section icon={<TrendingUp className="w-4 h-4 text-blue-500" />} title="Clasificación">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2">
              <StandingBlock st={home.standing} align="left" />
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 text-center whitespace-nowrap">
                Temporada<br />2026
              </div>
              <StandingBlock st={away.standing} align="right" />
            </div>
          </Section>
        )}

        {/* Recent form */}
        {(home.recentForm.length > 0 || away.recentForm.length > 0) && (
          <Section icon={<Calendar className="w-4 h-4 text-blue-500" />} title="Forma reciente (últimos 5)">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-1">
              <div className="flex gap-1.5">
                {home.recentForm.map((r, i) => <FormBadge key={i} r={r} />)}
                {home.recentForm.length === 0 && <span className="text-xs text-gray-400">Sin datos</span>}
              </div>
              <div />
              <div className="flex gap-1.5 justify-end">
                {away.recentForm.map((r, i) => <FormBadge key={i} r={r} />)}
                {away.recentForm.length === 0 && <span className="text-xs text-gray-400">Sin datos</span>}
              </div>
            </div>
          </Section>
        )}

        {/* Head to head */}
        <Section icon={<Activity className="w-4 h-4 text-blue-500" />} title="Historial de enfrentamientos">
          {h2h.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin enfrentamientos previos registrados.</p>
          ) : (
            <div className="space-y-2">
              {h2h.map((m, i) => {
                const homeWin = (m.homeScore ?? 0) > (m.awayScore ?? 0)
                return (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      {m.homeLogo && <img src={m.homeLogo} alt="" className="w-5 h-5 object-contain" />}
                      <span className={`font-bold ${homeWin ? "text-[#0a1628]" : "text-gray-400"}`}>{m.homeSigla ?? m.homeName}</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-[9px] text-gray-400 font-semibold">{fmtDate(m.date)}</span>
                        {m.season && (
                          <span className="text-[8px] font-black bg-gray-200 text-gray-500 px-1 py-0.5 rounded-full leading-none">
                            {m.season}
                          </span>
                        )}
                      </div>
                      <span className="font-black text-[#0a1628] tabular-nums">
                        {m.homeScore ?? "—"} – {m.awayScore ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${!homeWin ? "text-[#0a1628]" : "text-gray-400"}`}>{m.awaySigla ?? m.awayName}</span>
                      {m.awayLogo && <img src={m.awayLogo} alt="" className="w-5 h-5 object-contain" />}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* Stats comparison */}
        {(home.teamStats || away.teamStats) && (
          <Section icon={<BarChart2 className="w-4 h-4 text-blue-500" />} title="Comparativa de equipos">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                {home.logo && <img src={home.logo} alt="" className="w-5 h-5 object-contain" />}
                <span className="text-xs font-black text-[#0a1628]">{home.sigla ?? home.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#0a1628]">{away.sigla ?? away.name}</span>
                {away.logo && <img src={away.logo} alt="" className="w-5 h-5 object-contain" />}
              </div>
            </div>
            <StatBar label="PTS/p" homeVal={home.teamStats?.ptsAvg ?? null} awayVal={away.teamStats?.ptsAvg ?? null} />
            <StatBar label="REB/p" homeVal={home.teamStats?.rebAvg ?? null} awayVal={away.teamStats?.rebAvg ?? null} />
            <StatBar label="AST/p" homeVal={home.teamStats?.astAvg ?? null} awayVal={away.teamStats?.astAvg ?? null} />
            <StatBar label="%TC" homeVal={home.teamStats?.fgPct ?? null} awayVal={away.teamStats?.fgPct ?? null}
              format={v => `${v.toFixed(1)}%`} />
            <StatBar label="%T3" homeVal={home.teamStats?.threePtPct ?? null} awayVal={away.teamStats?.threePtPct ?? null}
              format={v => `${v.toFixed(1)}%`} />
            <StatBar label="ROB/p" homeVal={home.teamStats?.stlAvg ?? null} awayVal={away.teamStats?.stlAvg ?? null} />
          </Section>
        )}

        {/* Top players */}
        {(home.topPlayers.length > 0 || away.topPlayers.length > 0) && (
          <Section icon={<Users className="w-4 h-4 text-blue-500" />} title="Jugadores a seguir">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
                  {home.logo && <img src={home.logo} alt="" className="w-4 h-4 object-contain" />}
                  {home.sigla ?? home.name}
                </p>
                {home.topPlayers.map(p => <PlayerCard key={p.personId} player={p} />)}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 flex items-center gap-1.5 justify-end">
                  {away.sigla ?? away.name}
                  {away.logo && <img src={away.logo} alt="" className="w-4 h-4 object-contain" />}
                </p>
                {away.topPlayers.map(p => <PlayerCard key={p.personId} player={p} align="right" />)}
              </div>
            </div>
          </Section>
        )}

      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
        {icon}
        <h2 className="font-black text-sm uppercase tracking-wide text-[#0a1628]">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function StandingBlock({ st, align }: { st: Standing | null; align: "left" | "right" }) {
  if (!st) return <div className="text-xs text-gray-400">Sin datos</div>
  const right = align === "right"
  return (
    <div className={`flex flex-col gap-1 ${right ? "items-end text-right" : "items-start"}`}>
      {st.position != null && (
        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">#{st.position}</span>
      )}
      <div className={`flex items-center gap-2 ${right ? "flex-row-reverse" : ""}`}>
        <span className="text-xl font-black text-[#0a1628]">{st.wins}-{st.losses}</span>
        {st.winPct != null && (
          <span className="text-xs font-bold text-gray-400">{st.winPct.toFixed(0)}%</span>
        )}
      </div>
      {st.pointsFor != null && (
        <span className="text-[10px] text-gray-400 font-semibold">
          {right ? `PC: ${st.pointsAgainst ?? "—"} · PF: ${st.pointsFor}` : `PF: ${st.pointsFor} · PC: ${st.pointsAgainst ?? "—"}`}
        </span>
      )}
      {st.pointDiff != null && (
        <span className={`text-xs font-black ${st.pointDiff > 0 ? "text-green-600" : st.pointDiff < 0 ? "text-red-500" : "text-gray-400"}`}>
          {st.pointDiff > 0 ? `+${st.pointDiff}` : st.pointDiff}
        </span>
      )}
    </div>
  )
}

function PlayerCard({ player, align = "left" }: { player: TopPlayer; align?: "left" | "right" }) {
  const right = align === "right"
  return (
    <Link href={`/jugador/${player.personId}`}
      className={`flex items-center gap-2 bg-gray-50 hover:bg-blue-50 rounded-xl p-2.5 transition-colors ${right ? "flex-row-reverse" : ""}`}>
      {player.photoUrl
        ? <img src={player.photoUrl} alt={player.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />
        : player.teamLogo
          ? <img src={player.teamLogo} alt="" className="w-9 h-9 rounded-full object-contain bg-white border border-gray-200 p-0.5 shrink-0" />
          : <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
      }
      <div className={`flex-1 min-w-0 ${right ? "text-right" : ""}`}>
        <p className="text-xs font-bold text-[#0a1628] truncate leading-tight">{player.name}</p>
        <div className={`flex items-center gap-2 ${right ? "justify-end" : ""}`}>
          <span className="text-[10px] font-black text-blue-600">{player.ptsAvg.toFixed(1)} pts/p</span>
          <span className="text-[10px] text-gray-400">{player.rebAvg.toFixed(1)} reb</span>
        </div>
      </div>
    </Link>
  )
}
