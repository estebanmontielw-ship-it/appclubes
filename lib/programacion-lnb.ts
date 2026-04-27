import { getCompetitions, getSchedule, getTeams } from "@/lib/genius-sports"

/** Fetch live state from FibaLiveStats for a specific matchId.
 *  Returns score + current period + clock, or null if unavailable. */
async function fetchFibaLiveScore(
  matchId: string | number
): Promise<{ homeScore: number; awayScore: number; period: number | null; clock: string | null } | null> {
  try {
    const url = `https://fibalivestats.dcd.shared.geniussports.com/data/${matchId}/data.json`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const data = await res.json()

    // FibaLiveStats data.json structure: { tm: { "1": { score: N }, "2": { score: N } } }
    const teams = data?.tm
    if (!teams) return null

    const t1 = teams["1"]
    const t2 = teams["2"]
    if (t1 == null || t2 == null) return null

    const s1 = parseInt(String(t1.score ?? t1.pts ?? ""), 10)
    const s2 = parseInt(String(t2.score ?? t2.pts ?? ""), 10)
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) return null

    // Period + clock — try several field name variants used by FibaLiveStats
    const periodRaw = data?.period ?? data?.periodNumber ?? data?.actual?.period ?? null
    const period = periodRaw != null ? Number(periodRaw) : null
    const clockRaw = data?.clock ?? data?.gameClock ?? data?.actual?.clock ?? null
    const clock = typeof clockRaw === "string" ? normalizeClock(clockRaw) : null

    // FibaLiveStats team "1" = home (the hosting team is always first)
    return {
      homeScore: s1,
      awayScore: s2,
      period: Number.isFinite(period) ? (period as number) : null,
      clock,
    }
  } catch {
    return null
  }
}

/** Normalize FibaLiveStats clock strings ("MM:SS" or "MM:SS:FF") to "MM:SS". */
function normalizeClock(raw: string): string | null {
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!m) return null
  return `${m[1].padStart(2, "0")}:${m[2]}`
}

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
  statsUrl: string | null
  round: number | null
  roundLabel: string
  livePeriod?: number | null
  liveClock?: string | null
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

export interface CpbCompetition {
  id: string
  name: string
  categoria: string  // LNB | LNBF | U22_MASC | U22_FEM | U19_MASC | U17_MASC | U17_FEM | ...
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

function categoriaFromCompName(name: string): string {
  const u = name.toUpperCase()
  const hasFem = u.includes("LNBF") || u.includes("FEM") || u.includes("MUJER") || u.includes("WOMEN")
  if (u.includes("U22") || u.includes("U-22") || u.includes("SUB-22") || u.includes("SUB 22") || u.includes("DESARROLLO"))
    return hasFem ? "U22_FEM" : "U22_MASC"
  if (u.includes("U19") || u.includes("U-19") || u.includes("SUB-19") || u.includes("SUB 19"))
    return hasFem ? "U19_FEM" : "U19_MASC"
  if (u.includes("U17") || u.includes("U-17") || u.includes("SUB-17") || u.includes("SUB 17"))
    return hasFem ? "U17_FEM" : "U17_MASC"
  if (u.includes("U15") || u.includes("U-15") || u.includes("SUB-15") || u.includes("SUB 15"))
    return hasFem ? "U15_FEM" : "U15_MASC"
  if (u.includes("U13") || u.includes("U-13") || u.includes("SUB-13") || u.includes("SUB 13"))
    return hasFem ? "U13_FEM" : "U13_MASC"
  if (hasFem) return "LNBF"
  return "LNB"
}

function extractRound(m: any): number | null {
  const candidates = [
    m?.round,
    m?.roundNumber,
    m?.matchDayNumber,
    m?.matchday,
    m?.round?.roundNumber,
    m?.round?.number,
    m?.jornada,
    m?.matchRound,
  ]
  for (const v of candidates) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v
    if (typeof v === "string" && /^\d+$/.test(v)) { const n = parseInt(v, 10); if (n > 0) return n }
  }
  return null
}

function extractMatchSeqNum(m: any): number | null {
  const v = m?.matchNumber ?? m?.number ?? m?.gameNumber ?? null
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v
  if (typeof v === "string" && /^\d+$/.test(v)) { const n = parseInt(v, 10); return n > 0 ? n : null }
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

function parseScore(c: any): number | null {
  if (c == null) return null
  if (typeof c.score === "number") return c.score
  const s = c.scoreString ?? c.score ?? c.points ?? null
  if (s == null || s === "") return null
  const n = parseInt(String(s), 10)
  return Number.isFinite(n) ? n : null
}

function asString(v: any): string | null {
  if (typeof v === "string") return v
  if (typeof v === "number") return String(v)
  return null
}

function splitIso(v: string): { date: string | null; time: string | null } {
  const sep = v.includes("T") ? "T" : v.includes(" ") ? " " : null
  if (sep) {
    const [d, t] = v.split(sep)
    return { date: d ? d.slice(0, 10) : null, time: t ? t.slice(0, 5) : null }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return { date: v, time: null }
  if (/^\d{2}:\d{2}/.test(v)) return { date: null, time: v.slice(0, 5) }
  return { date: null, time: null }
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

const FECHA_LABELS = [
  "", "Primera", "Segunda", "Tercera", "Cuarta", "Quinta",
  "Sexta", "Séptima", "Octava", "Novena", "Décima",
  "Undécima", "Duodécima",
]
const fechaLabel = (n: number) =>
  n >= 1 && n <= 12 ? `${FECHA_LABELS[n]} Fecha` : `Fecha ${n}`

// ─────────────────────────────────────────────────────────────────────────────
// Shared schedule builder — processes raw Genius Sports data into NormalizedMatch[]
// ─────────────────────────────────────────────────────────────────────────────

function processScheduleData(
  rawMatches: any,
  rawTeams: any,
  withStatsUrl: boolean,
): { matches: NormalizedMatch[]; teams: NormalizedTeam[] } {
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

  const isHomeMarker = (c: any): boolean => {
    if (c?.isHomeCompetitor === 1 || c?.isHomeCompetitor === true || c?.isHomeCompetitor === "1") return true
    const q = c?.qualifier ?? c?.position ?? null
    if (q === 1 || q === "1") return true
    const fields = [c?.competitorType, c?.homeAway, c?.role, c?.teamQualifier]
    return fields.some((f) => {
      if (f == null) return false
      const s = String(f).toUpperCase().trim()
      return s === "HOME" || s === "H" || s === "LOCAL"
    })
  }

  const isAwayMarker = (c: any): boolean => {
    if (c?.isHomeCompetitor === 0 || c?.isHomeCompetitor === false || c?.isHomeCompetitor === "0") return true
    const q = c?.qualifier ?? c?.position ?? null
    if (q === 2 || q === "2") return true
    const fields = [c?.competitorType, c?.homeAway, c?.role, c?.teamQualifier]
    return fields.some((f) => {
      if (f == null) return false
      const s = String(f).toUpperCase().trim()
      return s === "AWAY" || s === "A" || s === "VISITOR" || s === "VISITANTE"
    })
  }

  const matchesFirstPass = matchItems.map((m) => {
    const competitors: any[] = Array.isArray(m.competitors) ? m.competitors : []
    const detectedHome = competitors.find(isHomeMarker)
    const detectedAway = competitors.find(isAwayMarker)
    const home = detectedHome ?? competitors[0] ?? null
    const away = detectedAway ?? competitors[1] ?? null
    const homeInfo = enrich(home)
    const awayInfo = enrich(away)

    const rawDate =
      asString(m.matchDate) ?? asString(m.date) ?? asString(m.startDate) ?? asString(m.scheduledDate) ?? null
    const rawTime =
      asString(m.matchTime) ?? asString(m.time) ?? asString(m.startTime) ?? asString(m.scheduledTime) ?? null

    let dateStr: string | null = null
    let timeStr: string | null = null

    if (rawDate) {
      const { date, time } = splitIso(rawDate)
      dateStr = date
      if (time) timeStr = time
    }
    if (rawTime) {
      const { date: tDate, time: tTime } = splitIso(rawTime)
      if (tTime && !timeStr) timeStr = tTime
      if (tDate && !dateStr) dateStr = tDate
    }

    const iso = dateStr ? (timeStr ? `${dateStr}T${timeStr}:00` : dateStr) : null
    const matchStatus = asString(m.matchStatus) ?? "SCHEDULED"
    const matchId =
      typeof m.matchId === "number" || typeof m.matchId === "string"
        ? m.matchId
        : `${homeInfo.name}-${awayInfo.name}-${dateStr ?? ""}`

    return {
      id: matchId,
      date: dateStr,
      time: timeStr,
      isoDateTime: iso,
      status: matchStatus,
      homeId: homeInfo.id,
      homeName: homeInfo.name,
      homeSigla: homeInfo.sigla,
      homeLogo: homeInfo.logo,
      homeScore: parseScore(home),
      awayId: awayInfo.id,
      awayName: awayInfo.name,
      awaySigla: awayInfo.sigla,
      awayLogo: awayInfo.logo,
      awayScore: parseScore(away),
      venue: extractVenue(m),
      statsUrl: withStatsUrl && m.matchId
        ? `https://fibalivestats.dcd.shared.geniussports.com/u/FPB/${m.matchId}/`
        : null,
      _rawRound: extractRound(m),
      _seqNum: extractMatchSeqNum(m),
    }
  })

  const hasAllRounds =
    matchesFirstPass.length > 0 && matchesFirstPass.every((m) => m._rawRound != null)

  const numTeamsInComp = Math.max(teamById.size, teamByName.size, 2)
  const matchesPerJornada = Math.max(1, Math.floor(numTeamsInComp / 2))

  let matches: NormalizedMatch[]

  if (hasAllRounds) {
    matches = matchesFirstPass.map((m) => {
      const { _rawRound, _seqNum, ...rest } = m
      return {
        ...rest,
        round: _rawRound ?? null,
        roundLabel: _rawRound != null ? fechaLabel(_rawRound) : "Sin fecha",
      } as NormalizedMatch
    })
  } else {
    const hasSeqNums = matchesFirstPass.every((m) => m._seqNum != null)
    if (hasSeqNums) {
      matches = matchesFirstPass.map((m) => {
        const { _rawRound, _seqNum, ...rest } = m
        const round = Math.ceil((_seqNum as number) / matchesPerJornada)
        return { ...rest, round, roundLabel: fechaLabel(round) } as NormalizedMatch
      })
    } else {
      const weekKeys = Array.from(
        new Set(matchesFirstPass.filter((m) => m.date).map((m) => isoWeekKey(m.date)))
      ).sort()
      const weekToRound = new Map<string, number>()
      weekKeys.forEach((k, i) => weekToRound.set(k, i + 1))
      matches = matchesFirstPass.map((m) => {
        const { _rawRound, _seqNum, ...rest } = m
        const key = isoWeekKey(m.date)
        const round = weekToRound.get(key) ?? null
        return {
          ...rest,
          round,
          roundLabel: round ? fechaLabel(round) : "Sin fecha",
        } as NormalizedMatch
      })
    }
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
      uniqueTeamsByName.set(m.homeName, { id: m.homeId ?? m.homeName, name: m.homeName, sigla: m.homeSigla, logo: m.homeLogo })
    }
    if (m.awayName && !uniqueTeamsByName.has(m.awayName)) {
      uniqueTeamsByName.set(m.awayName, { id: m.awayId ?? m.awayName, name: m.awayName, sigla: m.awaySigla, logo: m.awayLogo })
    }
  }
  const teams = Array.from(uniqueTeamsByName.values()).sort((a, b) => a.name.localeCompare(b.name))

  return { matches, teams }
}

// ─────────────────────────────────────────────────────────────────────────────
// Competition ID resolution
// ─────────────────────────────────────────────────────────────────────────────

/** Returns all CPB competitions active in the current year from Genius Sports. */
export async function resolveAllCpbCompetitions(): Promise<CpbCompetition[]> {
  const currentYear = new Date().getFullYear()
  try {
    const raw: any = await getCompetitions()
    const comps: any[] = raw?.response?.data || raw?.data || []
    const thisYear = comps.filter((c) => {
      const y = Number(c.year)
      return y === currentYear || y === currentYear - 1
    })
    const candidates = thisYear.filter(c => Number(c.year) === currentYear).length > 0
      ? thisYear.filter(c => Number(c.year) === currentYear)
      : thisYear
    if (candidates.length > 0) {
      return candidates.map((c) => ({
        id: String(c.competitionId),
        name: c.competitionName ?? String(c.competitionId),
        categoria: categoriaFromCompName(c.competitionName ?? ""),
      }))
    }
  } catch {
    // fall through to env var fallback
  }
  const envId = process.env.GENIUS_LNB_COMPETITION_ID
  if (envId) return [{ id: envId, name: "LNB", categoria: "LNB" }]
  return []
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
        const hasFem = name.includes("FEM") || name.includes("MUJER") || name.includes("WOMEN")
        return !hasFem && (name.includes("LNB") || (name.includes("LIGA") && name.includes("NACIONAL")))
      })
      .sort((a, b) => (b.year || 0) - (a.year || 0))

    const current =
      candidates.find((c) => c.year === now) ??
      candidates.find((c) => c.year === now - 1) ??
      candidates[0]

    if (current) return { id: String(current.competitionId), name: current.competitionName ?? null }
  } catch {
    // fall through
  }
  return { id: null, name: null }
}

async function resolveLnbfCompetitionId(): Promise<{ id: string | null; name: string | null }> {
  const envId = process.env.GENIUS_LNBF_COMPETITION_ID
  if (envId) return { id: envId, name: null }

  try {
    const raw: any = await getCompetitions()
    const comps: any[] = raw?.response?.data || raw?.data || []
    const now = new Date().getFullYear()
    const candidates = comps
      .filter((c) => {
        const name = String(c.competitionName || "").toUpperCase()
        // "LNBF APERTURA 2026" — el nombre contiene "LNBF" pero no "FEM"
        const hasFem = name.includes("LNBF") || name.includes("FEM") || name.includes("MUJER") || name.includes("WOMEN") || name.includes("DAMAS")
        const isLnb = name.includes("LNB") || (name.includes("LIGA") && name.includes("NACIONAL"))
        const isYouth = name.includes("U22") || name.includes("U-22") || name.includes("DESARROLLO")
        return hasFem && isLnb && !isYouth
      })
      .sort((a, b) => (b.year || 0) - (a.year || 0))

    const current =
      candidates.find((c) => c.year === now) ??
      candidates.find((c) => c.year === now - 1) ??
      candidates[0]

    if (current) return { id: String(current.competitionId), name: current.competitionName ?? null }
  } catch {
    // fall through
  }
  return { id: null, name: null }
}

async function resolveU22MCompetitionId(): Promise<{ id: string | null; name: string | null }> {
  const envId = process.env.GENIUS_U22M_COMPETITION_ID
  if (envId) return { id: envId, name: null }

  try {
    const raw: any = await getCompetitions()
    const comps: any[] = raw?.response?.data || raw?.data || []
    const now = new Date().getFullYear()
    const candidates = comps
      .filter((c) => {
        const name = String(c.competitionName || "").toUpperCase()
        const hasFem = name.includes("FEM") || name.includes("MUJER") || name.includes("WOMEN") || name.includes("DAMAS")
        return (
          !hasFem &&
          (name.includes("U22") || name.includes("U-22") || name.includes("DESARROLLO"))
        )
      })
      .sort((a, b) => (b.year || 0) - (a.year || 0))

    const current =
      candidates.find((c) => c.year === now) ??
      candidates.find((c) => c.year === now - 1) ??
      candidates[0]

    if (current) return { id: String(current.competitionId), name: current.competitionName ?? null }
  } catch {
    // fall through
  }
  return { id: null, name: null }
}

async function resolveU22FCompetitionId(): Promise<{ id: string | null; name: string | null }> {
  const envId = process.env.GENIUS_U22F_COMPETITION_ID
  if (envId) return { id: envId, name: null }

  try {
    const raw: any = await getCompetitions()
    const comps: any[] = raw?.response?.data || raw?.data || []
    const now = new Date().getFullYear()
    const candidates = comps
      .filter((c) => {
        const name = String(c.competitionName || "").toUpperCase()
        return (
          (name.includes("U22") || name.includes("U-22")) &&
          (name.includes("FEM") || name.includes("MUJER") || name.includes("WOMEN") || name.includes("DAMAS"))
        )
      })
      .sort((a, b) => (b.year || 0) - (a.year || 0))

    const current =
      candidates.find((c) => c.year === now) ??
      candidates.find((c) => c.year === now - 1) ??
      candidates[0]

    if (current) return { id: String(current.competitionId), name: current.competitionName ?? null }
  } catch {
    // fall through
  }
  return { id: null, name: null }
}

export async function resolveLnbCompetitionIdPublic() { return resolveLnbCompetitionId() }
export async function resolveLnbfCompetitionIdPublic() { return resolveLnbfCompetitionId() }
export async function resolveU22MCompetitionIdPublic() { return resolveU22MCompetitionId() }
export async function resolveU22FCompetitionIdPublic() { return resolveU22FCompetitionId() }

// ─────────────────────────────────────────────────────────────────────────────
// Schedule loaders
// ─────────────────────────────────────────────────────────────────────────────

// In basketball there are no ties — if Genius returns equal scores for a
// completed match (it does for some games that ended in OT), fall back to
// FibaLiveStats data.json which always has the correct final score.
async function fixBrokenCompletedScores(matches: NormalizedMatch[]): Promise<void> {
  const broken: NormalizedMatch[] = matches.filter(
    (m) =>
      m.status === "COMPLETE" &&
      ((m.homeScore != null && m.awayScore != null && m.homeScore === m.awayScore) ||
        m.homeScore == null ||
        m.awayScore == null)
  )
  if (broken.length === 0) return

  const fixes = await Promise.allSettled(broken.map((m) => fetchFibaLiveScore(m.id)))
  fixes.forEach((result, i) => {
    if (result.status !== "fulfilled" || !result.value) return
    const { homeScore, awayScore } = result.value
    if (homeScore === awayScore) return // FibaLiveStats also tied — skip
    const idx = matches.findIndex((m) => m.id === broken[i].id)
    if (idx !== -1) {
      matches[idx] = { ...matches[idx], homeScore, awayScore }
    }
  })
}

export async function loadLnbSchedule(): Promise<LnbSchedulePayload> {
  const { id: competitionId, name: competitionName } = await resolveLnbCompetitionId()
  if (!competitionId) {
    throw new Error(
      "No se encontró la competencia LNB. Definí GENIUS_LNB_COMPETITION_ID en las variables de entorno."
    )
  }

  const [rawMatches, rawTeams] = await Promise.all([
    getSchedule(competitionId),
    getTeams(competitionId).catch(() => null),
  ])

  let { matches, teams } = processScheduleData(rawMatches, rawTeams, true)

  // Enrich LIVE matches with real-time score from FibaLiveStats (LNB only)
  const liveMatches = matches.filter(
    (m) => m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
  )
  if (liveMatches.length > 0) {
    const liveScores = await Promise.allSettled(liveMatches.map((m) => fetchFibaLiveScore(m.id)))
    liveScores.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value) {
        const match = liveMatches[i]
        const idx = matches.findIndex((m) => m.id === match.id)
        if (idx !== -1) {
          matches[idx] = {
            ...matches[idx],
            homeScore: result.value.homeScore,
            awayScore: result.value.awayScore,
            livePeriod: result.value.period,
            liveClock: result.value.clock,
          }
        }
      }
    })
  }

  await fixBrokenCompletedScores(matches)

  return {
    competition: { id: competitionId, name: competitionName || "Liga Nacional de Básquetbol" },
    teams,
    matches,
    updatedAt: new Date().toISOString(),
  }
}

export async function loadLnbfSchedule(): Promise<LnbSchedulePayload> {
  const { id: competitionId, name: competitionName } = await resolveLnbfCompetitionId()
  if (!competitionId) {
    throw new Error(
      "No se encontró la competencia LNBF. Definí GENIUS_LNBF_COMPETITION_ID en las variables de entorno."
    )
  }

  const [rawMatches, rawTeams] = await Promise.all([
    getSchedule(competitionId),
    getTeams(competitionId).catch(() => null),
  ])

  let { matches, teams } = processScheduleData(rawMatches, rawTeams, true)

  const liveMatches = matches.filter(
    (m) => m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
  )
  if (liveMatches.length > 0) {
    const liveScores = await Promise.allSettled(liveMatches.map((m) => fetchFibaLiveScore(m.id)))
    liveScores.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value) {
        const match = liveMatches[i]
        const idx = matches.findIndex((m) => m.id === match.id)
        if (idx !== -1) {
          matches[idx] = {
            ...matches[idx],
            homeScore: result.value.homeScore,
            awayScore: result.value.awayScore,
            livePeriod: result.value.period,
            liveClock: result.value.clock,
          }
        }
      }
    })
  }

  await fixBrokenCompletedScores(matches)

  return {
    competition: { id: competitionId, name: competitionName || "LNB Femenino" },
    teams,
    matches,
    updatedAt: new Date().toISOString(),
  }
}

export async function loadU22MSchedule(): Promise<LnbSchedulePayload> {
  const { id: competitionId, name: competitionName } = await resolveU22MCompetitionId()
  if (!competitionId) {
    throw new Error(
      "No se encontró la competencia U22 Masculino. Definí GENIUS_U22M_COMPETITION_ID en las variables de entorno."
    )
  }

  const [rawMatches, rawTeams] = await Promise.all([
    getSchedule(competitionId),
    getTeams(competitionId).catch(() => null),
  ])

  const { matches, teams } = processScheduleData(rawMatches, rawTeams, false)

  return {
    competition: { id: competitionId, name: competitionName || "U22 Masculino" },
    teams,
    matches,
    updatedAt: new Date().toISOString(),
  }
}

export async function loadU22FSchedule(): Promise<LnbSchedulePayload> {
  const { id: competitionId, name: competitionName } = await resolveU22FCompetitionId()
  if (!competitionId) {
    throw new Error(
      "No se encontró la competencia U22 Femenino. Definí GENIUS_U22F_COMPETITION_ID en las variables de entorno."
    )
  }

  const [rawMatches, rawTeams] = await Promise.all([
    getSchedule(competitionId),
    getTeams(competitionId).catch(() => null),
  ])

  const { matches, teams } = processScheduleData(rawMatches, rawTeams, false)

  return {
    competition: { id: competitionId, name: competitionName || "U22 Femenino" },
    teams,
    matches,
    updatedAt: new Date().toISOString(),
  }
}

/** Mapeo de liga (key del flyer) a su schedule loader correspondiente. */
export function loadScheduleByLiga(liga: string): Promise<LnbSchedulePayload> {
  switch (liga) {
    case "lnbf": return loadLnbfSchedule()
    case "u22m": return loadU22MSchedule()
    case "u22f": return loadU22FSchedule()
    case "lnb":
    default:     return loadLnbSchedule()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI chatbot context
// ─────────────────────────────────────────────────────────────────────────────
/** Returns a plain-text summary of the LNB schedule for AI chatbot context. */
export async function getLnbScheduleContext(): Promise<string> {
  try {
    const { competition, matches } = await loadLnbSchedule()
    if (!matches.length) return ""

    const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    const fmtDate = (dateStr: string | null, timeStr: string | null): string => {
      if (!dateStr) return "Sin fecha"
      const d = new Date(dateStr + "T00:00:00Z")
      const label = `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
      return timeStr ? `${label} ${timeStr}` : label
    }

    const byRound = new Map<number, NormalizedMatch[]>()
    const noRound: NormalizedMatch[] = []
    for (const m of matches) {
      if (m.round != null) {
        const arr = byRound.get(m.round) ?? []
        arr.push(m)
        byRound.set(m.round, arr)
      } else {
        noRound.push(m)
      }
    }

    const lines: string[] = [`PROGRAMACIÓN ${competition.name.toUpperCase()}:`]
    const sortedRounds = Array.from(byRound.keys()).sort((a, b) => a - b)

    for (const round of sortedRounds) {
      const rMatches = byRound.get(round)!
      lines.push(`\nJORNADA ${round}:`)
      for (const m of rMatches) {
        const dt = fmtDate(m.date, m.time)
        const isLive = m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
        const isComplete = m.status === "COMPLETE"
        const home = m.homeSigla ? `${m.homeName} (${m.homeSigla})` : m.homeName
        const away = m.awaySigla ? `${m.awayName} (${m.awaySigla})` : m.awayName
        let line: string
        if (isLive) {
          line = `• ${dt} | ${home} ${m.homeScore ?? "?"} – ${m.awayScore ?? "?"} ${away} [EN VIVO]`
        } else if (isComplete && m.homeScore != null && m.awayScore != null) {
          line = `• ${dt} | ${home} ${m.homeScore} – ${m.awayScore} ${away} [FINAL]`
        } else {
          const venue = m.venue ? ` @ ${m.venue}` : ""
          line = `• ${dt} | ${home} (local) vs ${away}${venue}`
        }
        lines.push(line)
      }
    }

    if (noRound.length > 0) {
      lines.push("\nSIN JORNADA ASIGNADA:")
      for (const m of noRound) {
        lines.push(`• ${fmtDate(m.date, m.time)} | ${m.homeName} vs ${m.awayName}`)
      }
    }

    return lines.join("\n")
  } catch {
    return ""
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Standings computed from matches (independent of Genius's getStandings endpoint)
// ─────────────────────────────────────────────────────────────────────────────

export interface ComputedStanding {
  rank: number
  teamId: string | number
  teamName: string
  teamSigla: string | null
  teamLogo: string | null
  gamesPlayed: number
  wins: number
  losses: number
  winPct: number | null
  pointsFor: number | null
  pointsAgainst: number | null
  pointDiff: number | null
}

/** Compute league standings from the corrected match data. Independent of
 *  Genius's getStandings() endpoint, which can return stale/wrong records
 *  for OT games where Genius's own scoreString is broken. */
export function computeStandingsFromMatches(
  matches: NormalizedMatch[],
  teams: NormalizedTeam[]
): ComputedStanding[] {
  const completed = matches.filter(
    (m) => m.status === "COMPLETE" && m.homeScore != null && m.awayScore != null
  )
  if (completed.length === 0) return []

  type Acc = {
    teamId: string | number
    teamName: string
    teamSigla: string | null
    teamLogo: string | null
    wins: number
    losses: number
    gamesPlayed: number
    pointsFor: number
    pointsAgainst: number
  }
  const stats = new Map<string, Acc>()

  // Seed with all known teams so non-played teams still show up.
  for (const t of teams) {
    stats.set(String(t.id), {
      teamId: t.id,
      teamName: t.name,
      teamSigla: t.sigla,
      teamLogo: t.logo,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    })
  }

  const upsert = (
    id: string | number | null,
    name: string,
    sigla: string | null,
    logo: string | null
  ): Acc | null => {
    if (id == null) return null
    const key = String(id)
    let acc = stats.get(key)
    if (!acc) {
      acc = {
        teamId: id,
        teamName: name,
        teamSigla: sigla,
        teamLogo: logo,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      }
      stats.set(key, acc)
    }
    return acc
  }

  for (const m of completed) {
    if (m.homeScore === m.awayScore) continue // can't happen post-fix in basket
    const home = upsert(m.homeId, m.homeName, m.homeSigla, m.homeLogo)
    const away = upsert(m.awayId, m.awayName, m.awaySigla, m.awayLogo)
    if (!home || !away) continue
    home.gamesPlayed++
    away.gamesPlayed++
    home.pointsFor += m.homeScore!
    home.pointsAgainst += m.awayScore!
    away.pointsFor += m.awayScore!
    away.pointsAgainst += m.homeScore!
    if (m.homeScore! > m.awayScore!) {
      home.wins++
      away.losses++
    } else {
      away.wins++
      home.losses++
    }
  }

  const rows = Array.from(stats.values())
    .filter((s) => s.gamesPlayed > 0)
    .map<ComputedStanding>((s) => ({
      rank: 0,
      teamId: s.teamId,
      teamName: s.teamName,
      teamSigla: s.teamSigla,
      teamLogo: s.teamLogo,
      gamesPlayed: s.gamesPlayed,
      wins: s.wins,
      losses: s.losses,
      winPct: s.gamesPlayed > 0 ? s.wins / s.gamesPlayed : null,
      pointsFor: s.pointsFor,
      pointsAgainst: s.pointsAgainst,
      pointDiff: s.pointsFor - s.pointsAgainst,
    }))

  // Sort: wins desc, win% desc, point diff desc, PF desc
  rows.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    const aPct = a.winPct ?? 0
    const bPct = b.winPct ?? 0
    if (bPct !== aPct) return bPct - aPct
    const aDiff = a.pointDiff ?? 0
    const bDiff = b.pointDiff ?? 0
    if (bDiff !== aDiff) return bDiff - aDiff
    return (b.pointsFor ?? 0) - (a.pointsFor ?? 0)
  })

  rows.forEach((r, i) => (r.rank = i + 1))
  return rows
}
