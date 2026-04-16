/**
 * Genius Sports Warehouse API Client
 *
 * REST API: https://api.wh.geniussports.com/v1/basketball/
 * Auth: x-api-key header
 * Cache: in-memory with TTL
 */

const API_BASE = "https://api.wh.geniussports.com/v1/basketball"
const API_KEY = process.env.GENIUS_SPORTS_API_KEY || ""

// In-memory cache
const cache = new Map<string, { data: any; expires: number }>()

const CACHE_TTL = {
  short: 30 * 1000,        // 30 seconds — live match data
  medium: 5 * 60 * 1000,   // 5 minutes — standings, schedule
  long: 60 * 60 * 1000,    // 1 hour — competitions, teams
} as const

type CacheTTL = keyof typeof CACHE_TTL

function getCached(key: string): any | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: any, ttl: CacheTTL) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL[ttl] })
}

export async function geniusFetch(path: string, ttl: CacheTTL = "medium"): Promise<any> {
  const cacheKey = path

  // Check cache first
  const cached = getCached(cacheKey)
  if (cached) return cached

  const url = `${API_BASE}${path}`

  const res = await fetch(url, {
    headers: {
      "x-api-key": API_KEY,
      "Accept": "application/json",
    },
    next: { revalidate: 0 }, // Don't use Next.js cache, we manage our own
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Genius Sports API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  setCache(cacheKey, data, ttl)
  return data
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
      try {
        const raw = await geniusFetch(`/matches/${m.matchId}/players`, "medium")
        return raw?.response?.data ?? raw?.data ?? []
      } catch {
        return []
      }
    })
  )

  // Accumulate totals per player — only periodNumber 0 (game total), only participated
  const totals = new Map<number, {
    personId: number; playerName: string; teamName: string
    teamSigla: string | null; teamLogo: string | null; photoUrl: string | null
    games: number; pts: number; reb: number; ast: number; threePt: number
  }>()

  for (const players of playerDataArrays) {
    for (const p of players) {
      if (p.periodNumber !== 0 || !p.participated) continue
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

export async function getMatchStatistics(matchId: string | number) {
  return geniusFetch(`/matches/${matchId}/statistics`, "short")
}

export async function getSchedule(competitionId: string | number) {
  return geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "short")
}
