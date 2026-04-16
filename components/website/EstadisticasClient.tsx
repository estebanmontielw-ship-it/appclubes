"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react"
import type { PlayerStatFull, TeamStatFull } from "@/lib/genius-sports"

type Tab = "jugadores" | "equipos"
type SortDir = "asc" | "desc"

interface SortState { col: string; dir: SortDir }

// ─── Hero card ────────────────────────────────────────────────────────────────

const HERO_CONFIGS = [
  { key: "ptsAvg",   label: "Máximo Anotador",    unit: "pts/p",  gradient: "from-blue-600 to-indigo-700",   criteria: "mayor promedio de puntos" },
  { key: "rebAvg",   label: "Máximo Reboteador",   unit: "reb/p",  gradient: "from-amber-500 to-orange-600",  criteria: "mayor promedio de rebotes" },
  { key: "astAvg",   label: "Máximo Asistidor",    unit: "ast/p",  gradient: "from-emerald-500 to-teal-600",  criteria: "mayor promedio de asistencias" },
  { key: "effAvg",   label: "Mayor Eficiencia",    unit: "eff/p",  gradient: "from-purple-600 to-violet-700", criteria: "mayor índice de eficiencia" },
  { key: "fgPct",    label: "Mejor % de Tiro",     unit: "% TC",   gradient: "from-rose-500 to-red-600",      criteria: "mejor % tiro de campo (mín. 10 intentos)" },
]

function HeroCard({ config, player }: { config: typeof HERO_CONFIGS[0]; player: PlayerStatFull | null }) {
  if (!player) return null
  const val = config.key === "fgPct"
    ? `${(player.fgPct ?? 0).toFixed(1)}%`
    : `${(player[config.key as keyof PlayerStatFull] as number).toFixed(1)}`

  return (
    <div className={`relative rounded-2xl bg-gradient-to-br ${config.gradient} p-4 text-white overflow-hidden flex flex-col gap-3 shadow-lg`}>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_20%,white,transparent)]" />
      <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{config.label}</span>
      <div className="flex items-center gap-3">
        {player.photoUrl
          ? <img src={player.photoUrl} alt={player.playerName} className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shrink-0" />
          : player.teamLogo
            ? <img src={player.teamLogo} alt={player.teamName} className="w-12 h-12 rounded-full object-contain bg-white/20 p-1 border-2 border-white/30 shrink-0" />
            : <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-sm font-black shrink-0">{(player.teamSigla ?? player.teamName).slice(0,2)}</div>
        }
        <div className="min-w-0">
          <p className="font-black text-sm leading-tight truncate">{player.playerName}</p>
          <p className="text-[10px] opacity-70 truncate">{player.teamSigla ?? player.teamName}</p>
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black tabular-nums">{val}</span>
        <span className="text-[10px] font-bold opacity-70">{config.unit}</span>
      </div>
    </div>
  )
}

// ─── Sort header ──────────────────────────────────────────────────────────────

function SortTh({ col, label, sort, onSort, title, className = "" }: {
  col: string; label: string; sort: SortState; onSort: (col: string) => void
  title?: string; className?: string
}) {
  const active = sort.col === col
  return (
    <th
      title={title}
      onClick={() => onSort(col)}
      className={`px-2 py-3 text-center text-[10px] font-black uppercase tracking-wide cursor-pointer select-none whitespace-nowrap transition-colors ${active ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"} ${className}`}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {active
          ? sort.dir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />
        }
      </span>
    </th>
  )
}

// ─── Pct display ─────────────────────────────────────────────────────────────

function Pct({ v }: { v: number | null }) {
  if (v == null) return <span className="text-gray-300">—</span>
  return <span>{v.toFixed(1)}%</span>
}

// ─── Player table ─────────────────────────────────────────────────────────────

const PLAYER_COLS: { key: string; label: string; title: string; pct?: boolean }[] = [
  { key: "ptsAvg",     label: "PTS",  title: "Puntos por partido" },
  { key: "rebAvg",     label: "REB",  title: "Rebotes por partido" },
  { key: "astAvg",     label: "AST",  title: "Asistencias por partido" },
  { key: "stlAvg",     label: "ROB",  title: "Robos por partido" },
  { key: "blkAvg",     label: "TAP",  title: "Tapones por partido" },
  { key: "toAvg",      label: "PÉR",  title: "Pérdidas por partido" },
  { key: "minAvg",     label: "MIN",  title: "Minutos por partido" },
  { key: "fgPct",      label: "%TC",  title: "% Tiro de campo", pct: true },
  { key: "threePtPct", label: "%T3",  title: "% Triples", pct: true },
  { key: "ftPct",      label: "%TL",  title: "% Tiros libres", pct: true },
  { key: "effAvg",     label: "EFF",  title: "Eficiencia por partido" },
  { key: "games",      label: "PJ",   title: "Partidos jugados" },
]

function PlayerTable({ players, sort, onSort }: {
  players: PlayerStatFull[]; sort: SortState; onSort: (col: string) => void
}) {
  if (players.length === 0) return (
    <div className="py-16 text-center text-gray-400 text-sm">No hay jugadores que coincidan.</div>
  )
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="w-full text-xs bg-white">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wide text-gray-400 sticky left-0 bg-gray-50 z-10 min-w-[160px]">Jugador</th>
            <th className="text-left px-2 py-3 text-[10px] font-black uppercase tracking-wide text-gray-400 min-w-[90px] hidden sm:table-cell">Equipo</th>
            {PLAYER_COLS.map(c => (
              <SortTh key={c.key} col={c.key} label={c.label} title={c.title} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {players.map((p, i) => (
            <tr key={p.personId} className={`hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}>
              <td className="px-4 py-2.5 sticky left-0 bg-inherit z-10">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-black text-gray-200 w-4 shrink-0">{i + 1}</span>
                  {p.photoUrl
                    ? <img src={p.photoUrl} alt={p.playerName} className="w-7 h-7 rounded-full object-cover border border-gray-100 shrink-0" />
                    : p.teamLogo
                      ? <img src={p.teamLogo} alt={p.teamName} className="w-7 h-7 rounded-full object-contain bg-white border border-gray-100 p-0.5 shrink-0" />
                      : <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-400 shrink-0">{(p.teamSigla ?? p.teamName).slice(0,2)}</div>
                  }
                  <div className="min-w-0">
                    <p className="font-bold text-[#0a1628] truncate max-w-[110px]">{p.playerName}</p>
                    <p className="text-[9px] text-gray-400 sm:hidden truncate">{p.teamSigla ?? p.teamName}</p>
                  </div>
                </div>
              </td>
              <td className="px-2 py-2.5 text-gray-500 font-semibold hidden sm:table-cell">
                <div className="flex items-center gap-1.5">
                  {p.teamLogo && <img src={p.teamLogo} alt="" className="w-4 h-4 object-contain" />}
                  <span className="text-[10px]">{p.teamSigla ?? p.teamName}</span>
                </div>
              </td>
              {PLAYER_COLS.map(c => {
                const v = p[c.key as keyof PlayerStatFull] as number | null
                const isActive = sort.col === c.key
                return (
                  <td key={c.key} className={`px-2 py-2.5 text-center tabular-nums ${isActive ? "font-black text-blue-700" : "font-semibold text-gray-600"}`}>
                    {c.pct ? <Pct v={v as number | null} /> : (v == null || v === 0 && c.key !== "games") ? <span className="text-gray-300">—</span> : (v as number).toFixed(c.key === "games" ? 0 : 1)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Team table ───────────────────────────────────────────────────────────────

const TEAM_COLS: { key: string; label: string; title: string; pct?: boolean }[] = [
  { key: "ptsAvg",      label: "PTS/G", title: "Puntos por partido" },
  { key: "rebAvg",      label: "REB/G", title: "Rebotes por partido" },
  { key: "astAvg",      label: "AST/G", title: "Asistencias por partido" },
  { key: "stlAvg",      label: "ROB/G", title: "Robos por partido" },
  { key: "blkAvg",      label: "TAP/G", title: "Tapones por partido" },
  { key: "toAvg",       label: "PÉR/G", title: "Pérdidas por partido" },
  { key: "fgPct",       label: "%TC",   title: "% Tiro de campo", pct: true },
  { key: "threePtPct",  label: "%T3",   title: "% Triples", pct: true },
  { key: "ftPct",       label: "%TL",   title: "% Tiros libres", pct: true },
]

function TeamTable({ teams, sort, onSort }: {
  teams: TeamStatFull[]; sort: SortState; onSort: (col: string) => void
}) {
  if (teams.length === 0) return (
    <div className="py-16 text-center text-gray-400 text-sm">Sin datos de equipos.</div>
  )
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="w-full text-xs bg-white">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wide text-gray-400 min-w-[160px]">Equipo</th>
            <th className="text-center px-2 py-3 text-[10px] font-black uppercase tracking-wide text-gray-400">PJ</th>
            {TEAM_COLS.map(c => (
              <SortTh key={c.key} col={c.key} label={c.label} title={c.title} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {teams.map((t, i) => (
            <tr key={t.teamId} className={`hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-black text-gray-200 w-4">{i + 1}</span>
                  {t.teamLogo
                    ? <img src={t.teamLogo} alt={t.teamName} className="w-8 h-8 object-contain rounded-full border border-gray-100 bg-white p-0.5" />
                    : <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-400">{(t.teamSigla ?? t.teamName).slice(0,2)}</div>
                  }
                  <div>
                    <p className="font-bold text-[#0a1628] text-xs">{t.teamName}</p>
                    {t.teamSigla && <p className="text-[9px] text-gray-400">{t.teamSigla}</p>}
                  </div>
                </div>
              </td>
              <td className="px-2 py-3 text-center font-semibold text-gray-500">{t.games}</td>
              {TEAM_COLS.map(c => {
                const v = t[c.key as keyof TeamStatFull] as number | null
                const isActive = sort.col === c.key
                return (
                  <td key={c.key} className={`px-2 py-3 text-center tabular-nums ${isActive ? "font-black text-blue-700" : "font-semibold text-gray-600"}`}>
                    {c.pct ? <Pct v={v as number | null} /> : v != null ? (v as number).toFixed(1) : "—"}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EstadisticasClient() {
  const [data, setData] = useState<{ players: PlayerStatFull[]; teams: TeamStatFull[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("jugadores")
  const [search, setSearch] = useState("")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [playerSort, setPlayerSort] = useState<SortState>({ col: "ptsAvg", dir: "desc" })
  const [teamSort, setTeamSort] = useState<SortState>({ col: "ptsAvg", dir: "desc" })

  useEffect(() => {
    fetch("/api/genius/full-stats")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ players: [], teams: [] }))
      .finally(() => setLoading(false))
  }, [])

  const teamOptions = useMemo(() => {
    if (!data) return []
    const seen = new Map<number, { id: number; name: string; sigla: string | null }>()
    data.players.forEach(p => { if (!seen.has(p.teamId)) seen.set(p.teamId, { id: p.teamId, name: p.teamName, sigla: p.teamSigla }) })
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  const heroes = useMemo(() => {
    if (!data?.players.length) return []
    const all = data.players
    return HERO_CONFIGS.map(cfg => {
      let player: PlayerStatFull | null
      if (cfg.key === "fgPct") {
        player = all.filter(p => p.fga >= 10).sort((a, b) => (b.fgPct ?? 0) - (a.fgPct ?? 0))[0] ?? null
      } else {
        player = [...all].sort((a, b) => (b[cfg.key as keyof PlayerStatFull] as number) - (a[cfg.key as keyof PlayerStatFull] as number))[0] ?? null
      }
      return { config: cfg, player }
    })
  }, [data])

  const filteredPlayers = useMemo(() => {
    if (!data) return []
    let list = data.players
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.playerName.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q))
    }
    if (teamFilter !== "all") list = list.filter(p => String(p.teamId) === teamFilter)
    return [...list].sort((a, b) => {
      const av = (a[playerSort.col as keyof PlayerStatFull] as number) ?? -999
      const bv = (b[playerSort.col as keyof PlayerStatFull] as number) ?? -999
      return playerSort.dir === "desc" ? bv - av : av - bv
    })
  }, [data, search, teamFilter, playerSort])

  const sortedTeams = useMemo(() => {
    if (!data) return []
    return [...data.teams].sort((a, b) => {
      const av = (a[teamSort.col as keyof TeamStatFull] as number) ?? -999
      const bv = (b[teamSort.col as keyof TeamStatFull] as number) ?? -999
      return teamSort.dir === "desc" ? bv - av : av - bv
    })
  }, [data, teamSort])

  function handlePlayerSort(col: string) {
    setPlayerSort(prev => ({ col, dir: prev.col === col && prev.dir === "desc" ? "asc" : "desc" }))
  }
  function handleTeamSort(col: string) {
    setTeamSort(prev => ({ col, dir: prev.col === col && prev.dir === "desc" ? "asc" : "desc" }))
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-sm text-gray-400 font-semibold">Cargando estadísticas…</p>
    </div>
  )

  if (!data?.players.length) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
      <p className="text-gray-500 font-semibold">Estadísticas disponibles cuando haya partidos jugados.</p>
      <p className="text-sm text-gray-400 mt-2">Las estadísticas detalladas se publicarán a partir de la primera fecha.</p>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Hero — top players */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Mejores de la temporada</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {heroes.map(h => <HeroCard key={h.config.key} config={h.config} player={h.player} />)}
        </div>
        <p className="text-[10px] text-gray-400 mt-2.5 italic">
          Criterios: promedios en base a partidos disputados. % de tiro de campo requiere mínimo 10 intentos en la temporada.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["jugadores", "equipos"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-black capitalize transition-all ${tab === t ? "bg-white shadow text-[#0a1628]" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "jugadores" ? "Jugadores" : "Equipos"}
          </button>
        ))}
      </div>

      {/* Jugadores */}
      {tab === "jugadores" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugador o equipo…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                style={{ fontSize: 16 }}
              />
            </div>
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer">
              <option value="all">Todos los equipos</option>
              {teamOptions.map(t => <option key={t.id} value={String(t.id)}>{t.sigla ?? t.name}</option>)}
            </select>
            <p className="text-xs text-gray-400 self-center shrink-0">{filteredPlayers.length} jugadores</p>
          </div>
          <PlayerTable players={filteredPlayers} sort={playerSort} onSort={handlePlayerSort} />
          <p className="text-[10px] text-gray-400 italic text-center">
            Hacé clic en los encabezados de columna para ordenar. Los valores son promedios por partido salvo PJ.
          </p>
        </div>
      )}

      {/* Equipos */}
      {tab === "equipos" && (
        <div className="space-y-4">
          <TeamTable teams={sortedTeams} sort={teamSort} onSort={handleTeamSort} />
          <p className="text-[10px] text-gray-400 italic text-center">
            Estadísticas de equipo agregadas de todos los partidos disputados.
          </p>
        </div>
      )}
    </div>
  )
}
