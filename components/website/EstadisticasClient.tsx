"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, BarChart2 } from "lucide-react"
import type { PlayerStatFull, TeamStatFull } from "@/lib/genius-sports"

type Tab = "jugadores" | "equipos"
type CompKey = "lnb" | "lnbf"
type SortDir = "asc" | "desc"
interface SortState { col: string; dir: SortDir }

const COMP_TABS: { key: CompKey; label: string }[] = [
  { key: "lnb",  label: "LNB"  },
  { key: "lnbf", label: "LNBF" },
]

function normalizeName(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}
function namesMatch(a: string, b: string) {
  const na = normalizeName(a), nb = normalizeName(b)
  return na === nb || na.includes(nb) || nb.includes(na)
}

// ─── Hero cards ───────────────────────────────────────────────────────────────

const HERO_CONFIGS = [
  { key: "ptsAvg",  label: "Máx. Anotador",   unit: "pts/p",  gradient: "from-blue-600 to-indigo-700"   },
  { key: "rebAvg",  label: "Máx. Reboteador",  unit: "reb/p",  gradient: "from-amber-500 to-orange-600"  },
  { key: "astAvg",  label: "Máx. Asistidor",   unit: "ast/p",  gradient: "from-emerald-500 to-teal-600"  },
  { key: "effAvg",  label: "Mayor Eficiencia", unit: "eff/p",  gradient: "from-purple-600 to-violet-700" },
  { key: "fgPct",   label: "Mejor % Tiro",     unit: "% TC",   gradient: "from-rose-500 to-red-600"      },
]

function HeroCard({ config, player, onClick }: { config: typeof HERO_CONFIGS[0]; player: PlayerStatFull | null; onClick?: () => void }) {
  if (!player) return null
  const val = config.key === "fgPct"
    ? `${(player.fgPct ?? 0).toFixed(1)}%`
    : `${(player[config.key as keyof PlayerStatFull] as number).toFixed(1)}`
  return (
    <div onClick={onClick} className={`relative rounded-2xl bg-gradient-to-br ${config.gradient} p-4 text-white overflow-hidden flex flex-col gap-2.5 shadow-lg min-w-[200px] sm:min-w-[220px] md:min-w-0 snap-start shrink-0 md:shrink ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_20%,white,transparent)]" />
      <span className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-tight">{config.label}</span>
      <div className="flex items-center gap-2.5">
        {player.photoUrl
          ? <img src={player.photoUrl} alt={player.playerName} className="w-11 h-11 rounded-full object-cover border-2 border-white/30 shrink-0" />
          : player.teamLogo
            ? <img src={player.teamLogo} alt={player.teamName} className="w-11 h-11 rounded-full object-contain bg-white/20 p-1 border-2 border-white/30 shrink-0" />
            : <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-sm font-black shrink-0">{(player.teamSigla ?? player.teamName).slice(0,2)}</div>
        }
        <div className="min-w-0">
          <p className="font-black text-sm leading-tight truncate">{player.playerName}</p>
          <p className="text-[10px] opacity-70 truncate">{player.teamSigla ?? player.teamName}</p>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black tabular-nums">{val}</span>
        <span className="text-[10px] font-bold opacity-70">{config.unit}</span>
      </div>
    </div>
  )
}

// ─── Sort header ──────────────────────────────────────────────────────────────

function SortTh({ col, label, sort, onSort, title }: {
  col: string; label: string; sort: SortState; onSort: (c: string) => void; title?: string
}) {
  const active = sort.col === col
  return (
    <th title={title} onClick={() => onSort(col)}
      className={`px-2 py-3 text-center text-[10px] font-black uppercase tracking-wide cursor-pointer select-none whitespace-nowrap transition-colors ${active ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`}>
      <span className="inline-flex items-center gap-0.5">
        {label}
        {active
          ? sort.dir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  )
}

function Pct({ v }: { v: number | null }) {
  return v == null ? <span className="text-gray-300">—</span> : <span>{v.toFixed(1)}%</span>
}

// ─── Player table ─────────────────────────────────────────────────────────────

const PLAYER_COLS = [
  { key: "ptsAvg",     label: "PTS/p",  title: "Promedio de puntos por partido" },
  { key: "rebAvg",     label: "REB/p",  title: "Promedio de rebotes por partido" },
  { key: "astAvg",     label: "AST/p",  title: "Promedio de asistencias por partido" },
  { key: "stlAvg",     label: "ROB/p",  title: "Promedio de robos por partido" },
  { key: "blkAvg",     label: "TAP/p",  title: "Promedio de tapones por partido" },
  { key: "toAvg",      label: "PÉR/p",  title: "Promedio de pérdidas por partido" },
  { key: "minAvg",     label: "MIN/p",  title: "Promedio de minutos por partido" },
  { key: "fgPct",      label: "%TC",    title: "% Tiro de campo", pct: true },
  { key: "threePtPct", label: "%T3",    title: "% Triples", pct: true },
  { key: "ftPct",      label: "%TL",    title: "% Tiros libres", pct: true },
  { key: "effAvg",     label: "EFF/p",  title: "Promedio de eficiencia por partido" },
  { key: "games",      label: "PJ",     title: "Partidos jugados" },
]

// Row bg colors — solid (no opacity) so sticky column shows correctly on iOS Safari
const ROW_BG = ["bg-white", "bg-gray-50"]

function PlayerTable({ players, sort, onSort, onClickPlayer }: {
  players: PlayerStatFull[]; sort: SortState; onSort: (c: string) => void; onClickPlayer: (id: number) => void
}) {
  if (!players.length) return (
    <div className="py-12 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
      No hay jugadores que coincidan.
    </div>
  )
  return (
    <div className="relative rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* scroll shadow hint — right edge */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-20 md:hidden" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              {/* sticky header cell */}
              <th className="sticky left-0 z-10 text-left px-3 py-3 text-[10px] font-black uppercase tracking-wide text-gray-400 bg-gray-50 min-w-[150px] sm:min-w-[180px]">
                Jugador
              </th>
              <th className="text-left px-2 py-3 text-[10px] font-black uppercase tracking-wide text-gray-400 bg-gray-50 min-w-[80px] hidden sm:table-cell">
                Equipo
              </th>
              {PLAYER_COLS.map(c => (
                <SortTh key={c.key} col={c.key} label={c.label} title={c.title} sort={sort} onSort={onSort} />
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => {
              const rowBg = ROW_BG[i % 2]
              const isActive = (col: string) => sort.col === col
              return (
                <tr key={p.personId} onClick={() => onClickPlayer(p.personId)} className={`${rowBg} hover:bg-blue-50/40 active:bg-blue-100/60 transition-colors cursor-pointer`}>
                  {/* sticky player name cell — explicit bg matches row */}
                  <td className={`sticky left-0 z-10 px-3 py-3 ${rowBg}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-200 w-4 shrink-0 tabular-nums">{i + 1}</span>
                      {p.photoUrl
                        ? <img src={p.photoUrl} alt={p.playerName} className="w-7 h-7 rounded-full object-cover border border-gray-100 shrink-0" />
                        : p.teamLogo
                          ? <img src={p.teamLogo} alt={p.teamName} className="w-7 h-7 rounded-full object-contain bg-white border border-gray-100 p-0.5 shrink-0" />
                          : <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-400 shrink-0">{(p.teamSigla ?? p.teamName).slice(0,2)}</div>
                      }
                      <div className="min-w-0">
                        <p className="font-bold text-[#0a1628] truncate max-w-[100px] sm:max-w-[130px] leading-tight">{p.playerName}</p>
                        <p className="text-[9px] text-gray-400 sm:hidden truncate">{p.teamSigla ?? p.teamName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      {p.teamLogo && <img src={p.teamLogo} alt="" className="w-4 h-4 object-contain shrink-0" />}
                      <span className="text-[10px] font-semibold text-gray-500 truncate">{p.teamSigla ?? p.teamName}</span>
                    </div>
                  </td>
                  {PLAYER_COLS.map(c => {
                    const v = p[c.key as keyof PlayerStatFull] as number | null
                    return (
                      <td key={c.key} className={`px-2 py-3 text-center tabular-nums ${isActive(c.key) ? "font-black text-blue-700" : "font-semibold text-gray-600"}`}>
                        {c.pct
                          ? <Pct v={v as number | null} />
                          : (v == null || (v === 0 && c.key !== "games"))
                            ? <span className="text-gray-300">—</span>
                            : (v as number).toFixed(c.key === "games" ? 0 : 1)
                        }
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Team table ───────────────────────────────────────────────────────────────

const TEAM_COLS = [
  { key: "ptsAvg",     label: "PTS/G", title: "Puntos por partido" },
  { key: "rebAvg",     label: "REB/G", title: "Rebotes por partido" },
  { key: "astAvg",     label: "AST/G", title: "Asistencias por partido" },
  { key: "stlAvg",     label: "ROB/G", title: "Robos por partido" },
  { key: "blkAvg",     label: "TAP/G", title: "Tapones por partido" },
  { key: "toAvg",      label: "PÉR/G", title: "Pérdidas por partido" },
  { key: "fgPct",      label: "%TC",   title: "% Tiro de campo", pct: true },
  { key: "threePtPct", label: "%T3",   title: "% Triples", pct: true },
  { key: "ftPct",      label: "%TL",   title: "% Tiros libres", pct: true },
]

function TeamTable({ teams, sort, onSort, slugMap, onClickTeam }: {
  teams: TeamStatFull[]
  sort: SortState
  onSort: (c: string) => void
  slugMap: Map<number, string>
  onClickTeam: (slug: string) => void
}) {
  if (!teams.length) return (
    <div className="py-12 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">Sin datos de equipos.</div>
  )
  return (
    <div className="relative rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-20 md:hidden" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 text-left px-4 py-3 text-[10px] font-black uppercase tracking-wide text-gray-400 min-w-[150px]">Equipo</th>
              <th className="text-center px-2 py-3 text-[10px] font-black uppercase tracking-wide text-gray-400">PJ</th>
              {TEAM_COLS.map(c => <SortTh key={c.key} col={c.key} label={c.label} title={c.title} sort={sort} onSort={onSort} />)}
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              const rowBg = ROW_BG[i % 2]
              const slug = slugMap.get(t.teamId)
              return (
                <tr key={t.teamId} onClick={slug ? () => onClickTeam(slug) : undefined} className={`${rowBg} hover:bg-blue-50/40 transition-colors ${slug ? "cursor-pointer" : ""}`}>
                  <td className={`sticky left-0 z-10 px-4 py-3 ${rowBg}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-black text-gray-200 w-4">{i + 1}</span>
                      {t.teamLogo
                        ? <img src={t.teamLogo} alt={t.teamName} className="w-8 h-8 object-contain rounded-full border border-gray-100 bg-white p-0.5 shrink-0" />
                        : <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-400 shrink-0">{(t.teamSigla ?? t.teamName).slice(0,2)}</div>
                      }
                      <div>
                        <p className="font-bold text-[#0a1628] text-xs truncate max-w-[90px] sm:max-w-none">{t.teamName}</p>
                        {t.teamSigla && <p className="text-[9px] text-gray-400">{t.teamSigla}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center font-semibold text-gray-500">{t.games}</td>
                  {TEAM_COLS.map(c => {
                    const v = t[c.key as keyof TeamStatFull] as number | null
                    return (
                      <td key={c.key} className={`px-2 py-3 text-center tabular-nums ${sort.col === c.key ? "font-black text-blue-700" : "font-semibold text-gray-600"}`}>
                        {c.pct ? <Pct v={v as number | null} /> : v != null ? (v as number).toFixed(1) : "—"}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EstadisticasClient() {
  const router = useRouter()
  const [comp, setComp] = useState<CompKey>("lnb")
  const [cache, setCache] = useState<Partial<Record<CompKey, { players: PlayerStatFull[]; teams: TeamStatFull[] }>>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("jugadores")
  const [search, setSearch] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [playerSort, setPlayerSort] = useState<SortState>({ col: "ptsAvg", dir: "desc" })
  const [teamSort, setTeamSort] = useState<SortState>({ col: "ptsAvg", dir: "desc" })
  const [clubSlugMap, setClubSlugMap] = useState<Map<number, string>>(new Map())

  const data = cache[comp] ?? null

  const goToPlayer = (personId: number) => router.push(`/jugador/${personId}`)
  const goToTeam = (slug: string) => router.push(`/clubes/${slug}`)

  useEffect(() => {
    if (cache[comp]) return
    setLoading(true)
    Promise.all([
      fetch(`/api/genius/full-stats?competition=${comp}`).then(r => r.json()),
      fetch("/api/website/clubes").then(r => r.json()).catch(() => ({ clubes: [] })),
    ])
      .then(([statsData, clubsData]) => {
        setCache(prev => ({ ...prev, [comp]: { players: statsData.players ?? [], teams: statsData.teams ?? [] } }))
        const clubs: { nombre: string; slug: string }[] = clubsData.clubes ?? []
        const map = new Map<number, string>(clubSlugMap)
        for (const t of (statsData.teams ?? [])) {
          const club = clubs.find((c: { nombre: string; slug: string }) => namesMatch(c.nombre, t.teamName))
          if (club) map.set(t.teamId, club.slug)
        }
        setClubSlugMap(map)
      })
      .catch(() => setCache(prev => ({ ...prev, [comp]: { players: [], teams: [] } })))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp])

  function handleSelectComp(next: CompKey) {
    if (next === comp) return
    setSearch("")
    setTeamFilter("all")
    setComp(next)
  }

  const teamOptions = useMemo(() => {
    if (!data) return []
    const seen = new Map<number, { id: number; name: string; sigla: string | null }>()
    data.players.forEach(p => { if (!seen.has(p.teamId)) seen.set(p.teamId, { id: p.teamId, name: p.teamName, sigla: p.teamSigla }) })
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  const heroes = useMemo(() => {
    if (!data?.players.length) return []
    return HERO_CONFIGS.map(cfg => {
      const player = cfg.key === "fgPct"
        ? [...data.players].filter(p => p.fga >= 10).sort((a, b) => (b.fgPct ?? 0) - (a.fgPct ?? 0))[0] ?? null
        : [...data.players].sort((a, b) => (b[cfg.key as keyof PlayerStatFull] as number) - (a[cfg.key as keyof PlayerStatFull] as number))[0] ?? null
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

  const handlePlayerSort = (col: string) =>
    setPlayerSort(prev => ({ col, dir: prev.col === col && prev.dir === "desc" ? "asc" : "desc" }))
  const handleTeamSort = (col: string) =>
    setTeamSort(prev => ({ col, dir: prev.col === col && prev.dir === "desc" ? "asc" : "desc" }))

  const CompSwitch = (
    <div className="flex flex-wrap items-center gap-2">
      {COMP_TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => handleSelectComp(t.key)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
            comp === t.key
              ? "bg-[#0a1628] text-white border-[#0a1628] shadow-sm"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  if (loading) return (
    <div className="space-y-6">
      {CompSwitch}
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400 font-semibold">Cargando estadísticas…</p>
      </div>
    </div>
  )

  if (!data?.players.length) return (
    <div className="space-y-6">
      {CompSwitch}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
        <BarChart2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">Estadísticas disponibles cuando haya partidos jugados.</p>
        <p className="text-sm text-gray-400 mt-1">Las estadísticas detalladas se publicarán a partir de la primera fecha.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">

      {CompSwitch}

      {/* Hero — top 5 players, horizontal scroll on mobile */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Mejores de la temporada</p>
          <p className="text-[10px] text-gray-300 md:hidden">← deslizá</p>
        </div>
        <div className="flex md:grid md:grid-cols-5 gap-3 overflow-x-auto pb-3 md:pb-0 md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
          {heroes.map(h => <HeroCard key={h.config.key} config={h.config} player={h.player} onClick={h.player ? () => goToPlayer(h.player!.personId) : undefined} />)}
        </div>
        <p className="text-[10px] text-gray-400 mt-2 italic">
          Promedios en base a partidos disputados. % tiro de campo: mín. 10 intentos.
        </p>
      </div>

      {/* Tabs — full-width on mobile */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(["jugadores", "equipos"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-black capitalize transition-all ${tab === t ? "bg-white shadow text-[#0a1628]" : "text-gray-500 hover:text-gray-700 active:bg-white/50"}`}>
            {t === "jugadores" ? "Jugadores" : "Equipos"}
          </button>
        ))}
      </div>

      {/* Jugadores */}
      {tab === "jugadores" && (
        <div className="space-y-3">
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugador o equipo…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                style={{ fontSize: 16 }} /* prevents iOS zoom */
              />
            </div>
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer">
              <option value="all">Todos los equipos</option>
              {teamOptions.map(t => <option key={t.id} value={String(t.id)}>{t.sigla ?? t.name}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{filteredPlayers.length} jugadores</p>
            <p className="text-[10px] text-gray-300 md:hidden">← deslizá para ver más stats</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full">
              Valores: promedios por partido (columnas con /p)
            </p>
            <p className="text-[10px] text-gray-400">Tocá el nombre del jugador para ver su perfil</p>
          </div>
          <PlayerTable players={filteredPlayers} sort={playerSort} onSort={handlePlayerSort} onClickPlayer={goToPlayer} />
          <p className="text-[10px] text-gray-400 italic text-center">
            Tocá los encabezados para ordenar · % tiro de campo: mín. 10 intentos.
          </p>
        </div>
      )}

      {/* Equipos */}
      {tab === "equipos" && (
        <div className="space-y-3">
          <p className="text-[10px] text-gray-300 md:hidden text-right">← deslizá para ver más stats</p>
          <TeamTable teams={sortedTeams} sort={teamSort} onSort={handleTeamSort} slugMap={clubSlugMap} onClickTeam={goToTeam} />
          <p className="text-[10px] text-gray-400 italic text-center">
            Estadísticas de equipo agregadas de todos los partidos disputados.
          </p>
        </div>
      )}
    </div>
  )
}
