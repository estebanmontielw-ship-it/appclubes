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

export async function getLeaders(competitionId: string | number) {
  return geniusFetch(`/competitions/${competitionId}/leaders`, "medium")
}

export async function getMatchStatistics(matchId: string | number) {
  return geniusFetch(`/matches/${matchId}/statistics`, "short")
}

export async function getSchedule(competitionId: string | number) {
  return geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "short")
}
