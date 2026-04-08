import { getCompetitions, getSchedule, getTeams } from "@/lib/genius-sports"

/**
 * Shared loader for the LNB schedule. Used by both the public API route
 * (/api/website/programacion-lnb) and the server component page
 * (/programacionlnb) so we avoid an internal self-fetch during SSR/build.
 */

export interface NormalizedMatch {
  id: string | number
  date: string | null
  time: string | null
  isoDateTime: string | null
  status: string
  homeId: number | string | null
  homeName: string
  homeSigla: string | null
  homeLogo: string | null
  homeScore: number | null
  awayId: number | string | null
  awayName: string
  awaySigla: string | null
  awayLogo: string | null
  awayScore: number | null
  venue: string | null
  round: number | null
  roundLabel: string
}

export interface NormalizedTeam {
  id: string | number
  name: string
  sigla: string | null
  logo: string | null
}

export interface LnbSchedulePayload {
  competition: { id: string; name: string }
  teams: NormalizedTeam[]
  matches: NormalizedMatch[]
  updatedAt: string
}

async function resolveLnbCompetitionId(): Promise<{ id: string | null; name: string | null }> {
  const envId = process.env.GENIUS_LNB_COMPETITION_ID
  if (envId) return { id: envId, name: null }

  try {
    const raw: any = await getCompetitions()
    const comps: any[] = raw?.response?.data || raw?.data || []
    const now = new Date().getFullYear()
    const candidates = comps
      .filter((c) => {
        const name = String(c.competitionName || "").toUpperCase()
        return name.includes("LNB") || (name.includes("LIGA") && name.includes("NACIONAL"))
      })
      .sort((a, b) => (b.year || 0) - (a.year || 0))

    const current =
      candidates.find((c) => c.year === now) ??
      candidates.find((c) => c.year === now - 1) ??
      candidates[0]

    if (current) {
      return { id: String(current.competitionId), name: current.competitionName ?? null }
    }
  } catch {
    // fall through
  }

  return { id: null, name: null }
}

function extractRound(m: any): number | null {
  const candidates = [
    m?.round,
    m?.roundNumber,
    m?.matchDayNumber,
    m?.matchday,
    m?.matchNumber,
    m?.round?.roundNumber,
    m?.round?.number,
  ]
  for (const v of candidates) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v
    if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10)
  }
  return null
}

function siglaFromName(name: string): string {
  const cleaned = name.replace(/[^a-zA-ZñÑ ]/g, "").trim()
  const words = cleaned.split(/\s+/)
  if (words.length > 1) {
    return words
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 3)
      .toUpperCase()
  }
  return cleaned.slice(0, 3).toUpperCase()
}

function extractLogo(t: any): string | null {
  const v =
    t?.images?.logo?.T1?.url ??
    t?.images?.logo?.url ??
    t?.logoUrl ??
    t?.logo ??
    null
  return typeof v === "string" ? v : null
}

/** Returns a plain display string for the venue, handling both the flat
 *  `venueName` shape and the nested `venue: { venueName, locationName, ... }`
 *  shape that Genius Sports actually returns. */
function extractVenue(m: any): string | null {
  if (typeof m?.venueName === "string" && m.venueName.trim()) return m.venueName.trim()
  if (typeof m?.venue === "string" && m.venue.trim()) return m.venue.trim()
  if (m?.venue && typeof m.venue === "object") {
    const name =
      (typeof m.venue.venueName === "string" && m.venue.venueName) ||
      (typeof m.venue.venueNickname === "string" && m.venue.venueNickname) ||
      (typeof m.venue.name === "string" && m.venue.name) ||
      null
    const city =
      (typeof m.venue.locationName === "string" && m.venue.locationName) ||
      (typeof m.venue.suburb === "string" && m.venue.suburb) ||
      null
    if (name && city && name !== city) return `${name} · ${city}`
    return name || city || null
  }
  return null
}

/** Safely coerce a value to a string, otherwise null. */
function asString(v: any): string | null {
  if (typeof v === "string") return v
  if (typeof v === "number") return String(v)
  return null
}

const isoWeekKey = (dateStr: string | null): string => {
  if (!dateStr) return "zzzz"
  const d = new Date(dateStr + "T00:00:00Z")
  const target = new Date(d.valueOf())
  const dayNr = (d.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    )
  return `${target.getUTCFullYear()}-${String(week).padStart(2, "0")}`
}

export async function loadLnbSchedule(): Promise<LnbSchedulePayload> {
  const { id: competitionId, name: competitionName } = await resolveLnbCompetitionId()

  if (!competitionId) {
    throw new Error(
      "No se encontró la competencia LNB. Definí GENIUS_LNB_COMPETITION_ID en las variables de entorno o verificá que Genius Sports tenga la competencia activa."
    )
  }

  const [rawMatches, rawTeams] = await Promise.all([
    getSchedule(competitionId),
    getTeams(competitionId).catch(() => null),
  ])

  const matchItems: any[] =
    rawMatches?.response?.data || rawMatches?.data || (Array.isArray(rawMatches) ? rawMatches : [])
  const teamItems: any[] =
    rawTeams?.response?.data || rawTeams?.data || (Array.isArray(rawTeams) ? rawTeams : []) || []

  const teamById = new Map<string, NormalizedTeam>()
  const teamByName = new Map<string, NormalizedTeam>()

  for (const t of teamItems) {
    const id = asString(t.competitorId) ?? asString(t.teamId) ?? asString(t.id)
    const name =
      asString(t.competitorName) ?? asString(t.teamName) ?? asString(t.name) ?? "Equipo"
    const sigla = asString(t.competitorCode) ?? asString(t.teamCode) ?? asString(t.code)
    const logo = extractLogo(t)
    const normalized: NormalizedTeam = {
      id: id ?? name,
      name,
      sigla: sigla || siglaFromName(name),
      logo,
    }
    if (id != null) teamById.set(String(id), normalized)
    teamByName.set(name.toLowerCase(), normalized)
  }

  const enrich = (c: any) => {
    const id =
      typeof c?.competitorId === "number" || typeof c?.competitorId === "string"
        ? c.competitorId
        : typeof c?.teamId === "number" || typeof c?.teamId === "string"
          ? c.teamId
          : null
    const name = asString(c?.competitorName) ?? asString(c?.teamName) ?? "Equipo"
    const byId = id != null ? teamById.get(String(id)) : null
    const byName = teamByName.get(String(name).toLowerCase())
    const team = byId ?? byName ?? null
    return {
      id,
      name,
      sigla: team?.sigla ?? siglaFromName(name),
      logo: team?.logo ?? null,
    }
  }

  const matchesFirstPass = matchItems.map((m) => {
    const home = m.competitors?.[0]
    const away = m.competitors?.[1]
    const homeInfo = enrich(home)
    const awayInfo = enrich(away)

    const dateStr = asString(m.matchDate)
    const timeStr = asString(m.matchTime)
    let iso: string | null = null
    if (dateStr) {
      iso = timeStr ? `${dateStr.slice(0, 10)}T${timeStr.slice(0, 5)}:00` : dateStr
    }

    const matchStatus = asString(m.matchStatus) ?? "SCHEDULED"
    const matchId =
      typeof m.matchId === "number" || typeof m.matchId === "string"
        ? m.matchId
        : `${homeInfo.name}-${awayInfo.name}-${dateStr ?? ""}`

    return {
      id: matchId,
      date: dateStr ? dateStr.slice(0, 10) : null,
      time: timeStr ? timeStr.slice(0, 5) : null,
      isoDateTime: iso,
      status: matchStatus,
      homeId: homeInfo.id,
      homeName: homeInfo.name,
      homeSigla: homeInfo.sigla,
      homeLogo: homeInfo.logo,
      homeScore: typeof home?.score === "number" ? home.score : null,
      awayId: awayInfo.id,
      awayName: awayInfo.name,
      awaySigla: awayInfo.sigla,
      awayLogo: awayInfo.logo,
      awayScore: typeof away?.score === "number" ? away.score : null,
      venue: extractVenue(m),
      _rawRound: extractRound(m),
    }
  })

  const hasAllRounds =
    matchesFirstPass.length > 0 && matchesFirstPass.every((m) => m._rawRound != null)

  let matches: NormalizedMatch[]

  if (hasAllRounds) {
    matches = matchesFirstPass.map((m) => {
      const { _rawRound, ...rest } = m
      return {
        ...rest,
        round: _rawRound ?? null,
        roundLabel: `Fecha ${_rawRound}`,
      } as NormalizedMatch
    })
  } else {
    const weekKeys = Array.from(
      new Set(matchesFirstPass.filter((m) => m.date).map((m) => isoWeekKey(m.date)))
    ).sort()
    const weekToRound = new Map<string, number>()
    weekKeys.forEach((k, i) => weekToRound.set(k, i + 1))

    matches = matchesFirstPass.map((m) => {
      const { _rawRound, ...rest } = m
      const key = isoWeekKey(m.date)
      const round = weekToRound.get(key) ?? null
      return {
        ...rest,
        round,
        roundLabel: round ? `Fecha ${round}` : "Sin fecha",
      } as NormalizedMatch
    })
  }

  matches.sort((a, b) => {
    if (a.isoDateTime && b.isoDateTime) return a.isoDateTime.localeCompare(b.isoDateTime)
    if (a.isoDateTime) return -1
    if (b.isoDateTime) return 1
    return 0
  })

  const uniqueTeamsByName = new Map<string, NormalizedTeam>()
  for (const m of matches) {
    if (m.homeName && !uniqueTeamsByName.has(m.homeName)) {
      uniqueTeamsByName.set(m.homeName, {
        id: m.homeId ?? m.homeName,
        name: m.homeName,
        sigla: m.homeSigla,
        logo: m.homeLogo,
      })
    }
    if (m.awayName && !uniqueTeamsByName.has(m.awayName)) {
      uniqueTeamsByName.set(m.awayName, {
        id: m.awayId ?? m.awayName,
        name: m.awayName,
        sigla: m.awaySigla,
        logo: m.awayLogo,
      })
    }
  }
  const teams = Array.from(uniqueTeamsByName.values()).sort((a, b) => a.name.localeCompare(b.name))

  return {
    competition: {
      id: competitionId,
      name: competitionName || "Liga Nacional de Básquetbol",
    },
    teams,
    matches,
    updatedAt: new Date().toISOString(),
  }
}
