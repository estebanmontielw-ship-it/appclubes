/**
 * Genius Sports Warehouse API Client
 *
 * REST API: https://api.wh.geniussports.com/v1/basketball/
 * Auth: x-api-key header
 * Cache: in-memory with TTL
 */

const API_BASE = "https://api.wh.geniussports.com/v1/basketball"
const API_KEY = process.env.GENIUS_SPORTS_API_KEY || ""

// Revalidation seconds for Next.js Data Cache (shared across all serverless instances)
const CACHE_TTL_SECONDS = {
  short: 30,         // 30s — live match data
  medium: 300,       // 5 min — standings, schedule
  long: 3600,        // 1 hour — competitions, teams
} as const

type CacheTTL = keyof typeof CACHE_TTL_SECONDS

export async function geniusFetch(path: string, ttl: CacheTTL = "medium"): Promise<any> {
  const url = `${API_BASE}${path}`

  const res = await fetch(url, {
    headers: {
      "x-api-key": API_KEY,
      "Accept": "application/json",
    },
    next: { revalidate: CACHE_TTL_SECONDS[ttl] }, // Vercel Data Cache — shared across instances
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Genius Sports API error ${res.status}: ${text}`)
  }

  return res.json()
}

// --- High-level helpers ---

export async function getCompetitions() {
  // Paginate through ALL competitions (API max 500 per page)
  const allComps: any[] = []
  let offset = 0
  const limit = 500

  while (true) {
    const raw = await geniusFetch(`/competitions?limit=${limit}&offset=${offset}`, "long")
    const items = raw?.response?.data || raw?.data || (Array.isArray(raw) ? raw : [])
    if (!items.length) break
    allComps.push(...items)
    // If we got fewer than limit, we've reached the end
    if (items.length < limit) break
    offset += limit
  }

  return { response: { data: allComps } }
}

export async function getCompetition(competitionId: string | number) {
  return geniusFetch(`/competitions/${competitionId}`, "long")
}

export async function getMatches(competitionId?: string | number, params?: Record<string, string>) {
  const query = new URLSearchParams(params || {})
  if (competitionId) query.set("competitionId", String(competitionId))
  query.set("limit", "50")
  const qs = query.toString()
  return geniusFetch(`/matches?${qs}`, "medium")
}

export async function getMatch(matchId: string | number) {
  return geniusFetch(`/matches/${matchId}`, "short")
}

export async function getStandings(competitionId: string | number) {
  return geniusFetch(`/competitions/${competitionId}/standings`, "medium")
}

export async function getTeams(competitionId?: string | number) {
  const path = competitionId
    ? `/competitions/${competitionId}/teams?limit=100`
    : `/teams?limit=500`
  return geniusFetch(path, "long")
}

export async function getTeam(teamId: string | number) {
  return geniusFetch(`/teams/${teamId}`, "long")
}

/** Official registered roster for a team in a competition (includes bench players with 0 mins) */
export async function getCompetitionTeamPersons(competitionId: string | number, teamId: string | number) {
  return geniusFetch(`/competitions/${competitionId}/teams/${teamId}/persons?isPlayer=1&limit=100`, "medium")
}

/** Look up a single person by their Genius personId */
export async function getPerson(personId: string | number) {
  return geniusFetch(`/persons/${personId}`, "long")
}

export interface LeaderEntry {
  rank: number
  personId: number
  playerName: string
  teamName: string
  teamSigla: string | null
  teamLogo: string | null
  photoUrl: string | null
  value: number
  games: number
}

export interface LeaderStats {
  scoring: LeaderEntry[]
  rebounds: LeaderEntry[]
  assists: LeaderEntry[]
  totalScoring: LeaderEntry[]
  totalThreePointers: LeaderEntry[]
  totalAssists: LeaderEntry[]
}

// /competitions/{id}/leaders and /personstatistics return 500 in the v1 API.
// We aggregate from /matches/{matchId}/players for each completed match instead.
export async function getLeadersFromMatches(competitionId: string | number): Promise<LeaderStats> {
  const matchesRaw = await geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "medium")
  const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
  const completed = matches.filter((m: any) => m.matchStatus === "COMPLETE")

  const empty = { scoring: [], rebounds: [], assists: [], totalScoring: [], totalThreePointers: [], totalAssists: [] }
  if (completed.length === 0) return empty

  // Build teamId → logo map from match competitors
  const teamLogoMap = new Map<number, string>()
  for (const m of matches) {
    for (const c of m.competitors ?? []) {
      const logo = c.images?.logo?.T1?.url ?? c.images?.logo?.S1?.url ?? null
      if (c.teamId && logo) teamLogoMap.set(c.teamId, logo)
    }
  }

  const playerDataArrays = await Promise.all(
    completed.map(async (m: any) => {
      const teamIds: number[] = (m.competitors ?? [])
        .map((c: any) => c.teamId ?? c.competitorId)
        .filter(Boolean)
      const perTeam = await Promise.all(
        teamIds.map(async (tid: number) => {
          try {
            const raw = await geniusFetch(`/matches/${m.matchId}/players?teamId=${tid}`, "medium")
            return raw?.response?.data ?? raw?.data ?? []
          } catch { return [] }
        })
      )
      return perTeam.flat()
    })
  )

  // A player "played" if participated=1 OR has minutes > 0 (flag sometimes incorrect in LiveStats)
  const didPlay = (p: any) => p.periodNumber === 0 && (p.participated === 1 || p.participated === "1" || (p.sMinutes != null && p.sMinutes > 0))

  const totals = new Map<number, {
    personId: number; playerName: string; teamName: string
    teamSigla: string | null; teamLogo: string | null; photoUrl: string | null
    games: number; pts: number; reb: number; ast: number; threePt: number
  }>()

  for (const players of playerDataArrays) {
    for (const p of players) {
      if (!didPlay(p)) continue
      const id: number = p.personId
      if (!totals.has(id)) {
        totals.set(id, {
          personId: id,
          playerName: p.personName ?? `${p.firstName ?? ""} ${p.familyName ?? ""}`.trim(),
          teamName: p.teamName ?? "",
          teamSigla: p.teamCode ?? null,
          teamLogo: teamLogoMap.get(p.teamId) ?? null,
          photoUrl: p.images?.photo?.T1?.url ?? null,
          games: 0, pts: 0, reb: 0, ast: 0, threePt: 0,
        })
      }
      const e = totals.get(id)!
      e.games++
      e.pts += p.sPoints ?? 0
      e.reb += p.sReboundsTotal ?? 0
      e.ast += p.sAssists ?? 0
      e.threePt += p.sThreePointersMade ?? 0
    }
  }

  const all = Array.from(totals.values()).filter(p => p.games > 0)

  function toEntry(p: typeof all[0], value: number, rank: number): LeaderEntry {
    return {
      rank,
      personId: p.personId,
      playerName: p.playerName,
      teamName: p.teamName,
      teamSigla: p.teamSigla,
      teamLogo: p.teamLogo,
      photoUrl: p.photoUrl,
      value,
      games: p.games,
    }
  }

  function byAvg(key: "pts" | "reb" | "ast"): LeaderEntry[] {
    return all
      .map(p => ({ p, v: Math.round((p[key] / p.games) * 10) / 10 }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 10)
      .map(({ p, v }, i) => toEntry(p, v, i + 1))
  }

  function byTotal(key: "pts" | "ast" | "threePt"): LeaderEntry[] {
    return all
      .map(p => ({ p, v: p[key] }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 10)
      .map(({ p, v }, i) => toEntry(p, v, i + 1))
  }

  return {
    scoring: byAvg("pts"),
    rebounds: byAvg("reb"),
    assists: byAvg("ast"),
    totalScoring: byTotal("pts"),
    totalThreePointers: byTotal("threePt"),
    totalAssists: byTotal("ast"),
  }
}

export interface PlayerStatFull {
  personId: number
  playerName: string
  teamName: string
  teamId: number
  teamSigla: string | null
  teamLogo: string | null
  photoUrl: string | null
  games: number
  // totals
  pts: number; reb: number; rebOff: number; rebDef: number
  ast: number; stl: number; blk: number; to: number
  min: number
  fgm: number; fga: number
  threePtM: number; threePtA: number
  ftm: number; fta: number
  fouls: number; eff: number
  // averages
  ptsAvg: number; rebAvg: number; astAvg: number
  stlAvg: number; blkAvg: number; toAvg: number; minAvg: number; effAvg: number
  // percentages (null if 0 attempts)
  fgPct: number | null; threePtPct: number | null; ftPct: number | null
}

export interface TeamStatFull {
  teamId: number
  teamName: string
  teamSigla: string | null
  teamLogo: string | null
  games: number
  ptsAvg: number; rebAvg: number; astAvg: number
  stlAvg: number; blkAvg: number; toAvg: number
  fgPct: number | null; threePtPct: number | null; ftPct: number | null
}

export async function getAllPlayerStats(competitionId: string | number): Promise<{ players: PlayerStatFull[], teams: TeamStatFull[] }> {
  const matchesRaw = await geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "medium")
  const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
  const completed = matches.filter((m: any) => m.matchStatus === "COMPLETE")

  const teamLogoMap = new Map<number, string>()
  const allTeamsMap = new Map<number, { teamId: number; teamName: string; teamSigla: string | null; teamLogo: string | null }>()
  for (const m of matches) {
    for (const c of m.competitors ?? []) {
      const logo = c.images?.logo?.T1?.url ?? c.images?.logo?.S1?.url ?? null
      const tid = c.teamId ?? c.competitorId
      if (tid && logo) teamLogoMap.set(tid, logo)
      if (tid && !allTeamsMap.has(tid)) {
        allTeamsMap.set(tid, {
          teamId: tid,
          teamName: c.competitorName ?? c.teamName ?? "",
          teamSigla: c.teamCode ?? null,
          teamLogo: logo,
        })
      }
    }
  }
  Array.from(allTeamsMap.entries()).forEach(([tid, t]) => {
    if (!t.teamLogo && teamLogoMap.has(tid)) t.teamLogo = teamLogoMap.get(tid)!
  })

  if (completed.length === 0) {
    const teams: TeamStatFull[] = Array.from(allTeamsMap.values()).map(t => ({
      teamId: t.teamId, teamName: t.teamName, teamSigla: t.teamSigla,
      teamLogo: t.teamLogo, games: 0,
      ptsAvg: 0, rebAvg: 0, astAvg: 0, stlAvg: 0, blkAvg: 0, toAvg: 0,
      fgPct: null, threePtPct: null, ftPct: null,
    }))
    return { players: [], teams }
  }

  const playerDataArrays = await Promise.all(
    completed.map(async (m: any) => {
      try {
        const teamIds: number[] = (m.competitors ?? [])
          .map((c: any) => c.teamId ?? c.competitorId)
          .filter(Boolean)
        const perTeam = await Promise.all(
          teamIds.map(async (tid: number) => {
            try {
              const raw = await geniusFetch(`/matches/${m.matchId}/players?teamId=${tid}`, "medium")
              return raw?.response?.data ?? raw?.data ?? []
            } catch { return [] }
          })
        )
        return perTeam.flat()
      } catch { return [] }
    })
  )

  type Acc = {
    personId: number; playerName: string; teamName: string; teamId: number
    teamSigla: string | null; teamLogo: string | null; photoUrl: string | null
    games: number; pts: number; reb: number; rebOff: number; rebDef: number
    ast: number; stl: number; blk: number; to: number; min: number
    fgm: number; fga: number; threePtM: number; threePtA: number
    ftm: number; fta: number; fouls: number; eff: number
  }

  const playerMap = new Map<number, Acc>()
  const teamMap = new Map<number, Acc & { teamGames: Set<number> }>()

  // A player "played" if participated=1, has minutes > 0, or has any recorded activity
  // (participated flag is sometimes incorrect in Genius data)
  const didPlay = (p: any) => {
    if (p.periodNumber !== 0) return false
    if (p.participated === 1 || p.participated === "1") return true
    if (p.sMinutes != null && p.sMinutes > 0) return true
    return (p.sPoints ?? 0) > 0 || (p.sReboundsTotal ?? 0) > 0 ||
      (p.sAssists ?? 0) > 0 || (p.sSteals ?? 0) > 0 || (p.sBlocks ?? 0) > 0 ||
      (p.sTurnovers ?? 0) > 0 || (p.sFoulsPersonal ?? 0) > 0 ||
      (p.sTwoPointersAttempted ?? 0) > 0 || (p.sThreePointersAttempted ?? 0) > 0 ||
      (p.sFreeThrowsAttempted ?? 0) > 0
  }

  for (let i = 0; i < playerDataArrays.length; i++) {
    const matchId = completed[i].matchId
    for (const p of playerDataArrays[i]) {
      if (!didPlay(p)) continue
      const pid: number = p.personId
      const tid: number = p.teamId
      if (!playerMap.has(pid)) {
        playerMap.set(pid, {
          personId: pid,
          playerName: p.personName ?? `${p.firstName ?? ""} ${p.familyName ?? ""}`.trim(),
          teamName: p.teamName ?? "", teamId: tid,
          teamSigla: p.teamCode ?? null,
          teamLogo: teamLogoMap.get(tid) ?? null,
          photoUrl: p.images?.photo?.T1?.url ?? null,
          games: 0, pts: 0, reb: 0, rebOff: 0, rebDef: 0,
          ast: 0, stl: 0, blk: 0, to: 0, min: 0,
          fgm: 0, fga: 0, threePtM: 0, threePtA: 0,
          ftm: 0, fta: 0, fouls: 0, eff: 0,
        })
      }
      const pe = playerMap.get(pid)!
      pe.games++; pe.pts += p.sPoints ?? 0; pe.reb += p.sReboundsTotal ?? 0
      pe.rebOff += p.sReboundsOffensive ?? 0; pe.rebDef += p.sReboundsDefensive ?? 0
      pe.ast += p.sAssists ?? 0; pe.stl += p.sSteals ?? 0; pe.blk += p.sBlocks ?? 0
      pe.to += p.sTurnovers ?? 0; pe.min += p.sMinutes ?? 0
      pe.fgm += p.sFieldGoalsMade ?? 0; pe.fga += p.sFieldGoalsAttempted ?? 0
      pe.threePtM += p.sThreePointersMade ?? 0; pe.threePtA += p.sThreePointersAttempted ?? 0
      pe.ftm += p.sFreeThrowsMade ?? 0; pe.fta += p.sFreeThrowsAttempted ?? 0
      pe.fouls += p.sFoulsPersonal ?? 0; pe.eff += p.sEfficiency ?? 0

      if (!teamMap.has(tid)) {
        teamMap.set(tid, {
          personId: tid, playerName: "", teamName: p.teamName ?? "", teamId: tid,
          teamSigla: p.teamCode ?? null, teamLogo: teamLogoMap.get(tid) ?? null,
          photoUrl: null, games: 0, pts: 0, reb: 0, rebOff: 0, rebDef: 0,
          ast: 0, stl: 0, blk: 0, to: 0, min: 0,
          fgm: 0, fga: 0, threePtM: 0, threePtA: 0,
          ftm: 0, fta: 0, fouls: 0, eff: 0, teamGames: new Set(),
        })
      }
      const te = teamMap.get(tid)!
      te.pts += p.sPoints ?? 0; te.reb += p.sReboundsTotal ?? 0
      te.ast += p.sAssists ?? 0; te.stl += p.sSteals ?? 0; te.blk += p.sBlocks ?? 0
      te.to += p.sTurnovers ?? 0
      te.fgm += p.sFieldGoalsMade ?? 0; te.fga += p.sFieldGoalsAttempted ?? 0
      te.threePtM += p.sThreePointersMade ?? 0; te.threePtA += p.sThreePointersAttempted ?? 0
      te.ftm += p.sFreeThrowsMade ?? 0; te.fta += p.sFreeThrowsAttempted ?? 0
      te.teamGames.add(matchId)
    }
  }

  // Merge official team rosters so registered players with 0 games still appear
  await Promise.all(
    Array.from(allTeamsMap.keys()).map(async (tid) => {
      try {
        const raw = await geniusFetch(`/competitions/${competitionId}/teams/${tid}/persons?isPlayer=1&limit=100`, "long")
        const persons: any[] = raw?.response?.data ?? raw?.data ?? []
        const teamInfo = allTeamsMap.get(tid)
        for (const person of persons) {
          const pid: number = person.personId
          if (!pid || playerMap.has(pid)) continue
          playerMap.set(pid, {
            personId: pid,
            playerName: `${person.firstName ?? ""} ${person.familyName ?? ""}`.trim(),
            teamName: person.primaryTeamName ?? teamInfo?.teamName ?? "",
            teamId: tid,
            teamSigla: teamInfo?.teamSigla ?? null,
            teamLogo: teamLogoMap.get(tid) ?? null,
            photoUrl: person.images?.photo?.T1?.url ?? null,
            games: 0, pts: 0, reb: 0, rebOff: 0, rebDef: 0,
            ast: 0, stl: 0, blk: 0, to: 0, min: 0,
            fgm: 0, fga: 0, threePtM: 0, threePtA: 0,
            ftm: 0, fta: 0, fouls: 0, eff: 0,
          })
        }
      } catch { /* roster unavailable for this team */ }
    })
  )

  const avg = (total: number, games: number) => games > 0 ? Math.round((total / games) * 10) / 10 : 0
  const pct = (made: number, att: number) => att > 0 ? Math.round((made / att) * 1000) / 10 : null

  const players: PlayerStatFull[] = Array.from(playerMap.values())
    .map(p => ({
      ...p,
      ptsAvg: avg(p.pts, p.games), rebAvg: avg(p.reb, p.games),
      astAvg: avg(p.ast, p.games), stlAvg: avg(p.stl, p.games),
      blkAvg: avg(p.blk, p.games), toAvg: avg(p.to, p.games),
      minAvg: avg(p.min, p.games), effAvg: avg(p.eff, p.games),
      fgPct: pct(p.fgm, p.fga), threePtPct: pct(p.threePtM, p.threePtA), ftPct: pct(p.ftm, p.fta),
    }))
    .sort((a, b) => {
      // Players who haven't played yet go to the bottom
      if (a.games === 0 && b.games > 0) return 1
      if (a.games > 0 && b.games === 0) return -1
      return b.ptsAvg - a.ptsAvg
    })

  const teamsFromStats: TeamStatFull[] = Array.from(teamMap.values()).map(t => {
    const g = t.teamGames.size
    return {
      teamId: t.teamId, teamName: t.teamName, teamSigla: t.teamSigla,
      teamLogo: t.teamLogo, games: g,
      ptsAvg: avg(t.pts, g), rebAvg: avg(t.reb, g), astAvg: avg(t.ast, g),
      stlAvg: avg(t.stl, g), blkAvg: avg(t.blk, g), toAvg: avg(t.to, g),
      fgPct: pct(t.fgm, t.fga), threePtPct: pct(t.threePtM, t.threePtA), ftPct: pct(t.ftm, t.fta),
    }
  })

  const statsTeamIds = new Set(teamsFromStats.map(t => t.teamId))
  const teamsWithNoStats: TeamStatFull[] = Array.from(allTeamsMap.values())
    .filter(t => !statsTeamIds.has(t.teamId))
    .map(t => ({
      teamId: t.teamId, teamName: t.teamName, teamSigla: t.teamSigla,
      teamLogo: t.teamLogo, games: 0,
      ptsAvg: 0, rebAvg: 0, astAvg: 0, stlAvg: 0, blkAvg: 0, toAvg: 0,
      fgPct: null, threePtPct: null, ftPct: null,
    }))

  const teams: TeamStatFull[] = [...teamsFromStats, ...teamsWithNoStats]
    .sort((a, b) => b.ptsAvg - a.ptsAvg)

  return { players, teams }
}

export async function getMatchStatistics(matchId: string | number) {
  return geniusFetch(`/matches/${matchId}/statistics`, "short")
}

export async function getSchedule(competitionId: string | number) {
  return geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "short")
}
