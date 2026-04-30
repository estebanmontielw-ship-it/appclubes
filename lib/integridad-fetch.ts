/**
 * Fetching de datos para el módulo de integridad.
 *
 * Reutiliza el cliente de Genius Sports (`lib/genius-sports.ts`) y los
 * datos públicos de FibaLiveStats. La lógica de detección de patrones
 * vive en `lib/integridad.ts` (puro).
 */

import { geniusFetch, getMatch } from "@/lib/genius-sports"
import type { BoxscorePlayer, BoxscoreTeam, MatchSnapshot } from "@/lib/integridad"

const FIBA_BASE = "https://fibalivestats.dcd.shared.geniussports.com"

interface FetchedTeam {
  id: number
  name: string
  sigla: string | null
  score: number | null
  isHome: boolean
}

/** Helpers locales — formatos de Genius/FibaLiveStats. */

function parseDateTime(matchTime: unknown): string | null {
  if (typeof matchTime !== "string" || !matchTime) return null
  const parts = matchTime.split(" ")
  const date = parts[0]
  const time = parts[1] ?? "00:00:00"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  return `${date}T${time}`
}

function parseScore(c: any): number | null {
  if (typeof c?.score === "number") return c.score
  const raw = c?.scoreString ?? c?.score ?? c?.points
  if (raw == null || raw === "") return null
  const n = parseInt(String(raw), 10)
  return Number.isFinite(n) ? n : null
}

function pickLogo(c: any): string | null {
  return c?.images?.logo?.T1?.url ?? c?.images?.logo?.S1?.url ?? null
}

/** Mapeo robusto de un objeto player (Genius warehouse o FibaLiveStats). */
function mapPlayer(p: any): BoxscorePlayer {
  return {
    name: (p.personName ?? `${p.fn ?? p.firstName ?? ""} ${p.ln ?? p.familyName ?? p.lastName ?? ""}`).trim(),
    number: String(p.no ?? p.shirtNumber ?? p.shirt ?? "–"),
    min: p.sMinutes ?? p.min ?? "–",
    pts: p.sPoints ?? 0,
    fg2m: p.sTwoPointersMade ?? 0,
    fg2a: p.sTwoPointersAttempted ?? 0,
    fg3m: p.sThreePointersMade ?? 0,
    fg3a: p.sThreePointersAttempted ?? 0,
    ftm: p.sFreeThrowsMade ?? 0,
    fta: p.sFreeThrowsAttempted ?? 0,
    reb: p.sReboundsTotal ?? 0,
    ast: p.sAssists ?? 0,
    stl: p.sSteals ?? 0,
    blk: p.sBlocks ?? 0,
    to: p.sTurnovers ?? 0,
    pf: p.sFoulsPersonal ?? 0,
    starter: !!(p.starter ?? p.starting ?? p.isStarting ?? p.isStarter),
    captain: !!p.captain,
  }
}

function dedupePlayers(arr: BoxscorePlayer[]): BoxscorePlayer[] {
  const seen = new Set<string>()
  const out: BoxscorePlayer[] = []
  for (const p of arr) {
    const key = `${p.number}-${p.name.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out
}

/**
 * Construye un MatchSnapshot listo para `detectPatterns()`.
 *
 * Estrategia de fetching (3 calls al API en el peor caso):
 *   1. /matches/{matchId}                            → home/away + score
 *   2. FibaLiveStats data.json                       → period scores + players + flags
 *   3. /matches/{matchId}/teams/{teamId}/players × 2 → fallback de stats si FIBA no tiene
 */
export async function buildMatchSnapshot(matchId: string | number): Promise<MatchSnapshot> {
  const matchRaw: any = await getMatch(matchId)
  const m = matchRaw?.response?.data ?? matchRaw?.data ?? matchRaw

  const competitors: any[] = m?.competitors ?? []
  if (competitors.length < 2) {
    throw new Error(`Partido ${matchId}: no se encontraron 2 competidores en la respuesta de Genius`)
  }

  const homeC = competitors.find((c) => c.isHomeCompetitor === 1) ?? competitors[0]
  const awayC = competitors.find((c) => c.isHomeCompetitor === 0) ?? competitors[1]

  const home: FetchedTeam = {
    id: homeC.teamId ?? homeC.competitorId,
    name: homeC.competitorName ?? homeC.teamName ?? "Local",
    sigla: homeC.teamCode ?? null,
    score: parseScore(homeC),
    isHome: true,
  }
  const away: FetchedTeam = {
    id: awayC.teamId ?? awayC.competitorId,
    name: awayC.competitorName ?? awayC.teamName ?? "Visitante",
    sigla: awayC.teamCode ?? null,
    score: parseScore(awayC),
    isHome: false,
  }

  // FibaLiveStats: period scores + players + flags (starter/captain)
  let fibaData: any = null
  try {
    const r = await fetch(`${FIBA_BASE}/data/${matchId}/data.json`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    })
    if (r.ok) fibaData = await r.json()
  } catch {
    // sin FibaLiveStats: seguimos con Genius nada más
  }

  const fibaTeams: any[] = fibaData?.tm ? Object.values(fibaData.tm) : []
  const fibaHome = fibaTeams.find((t: any) => t.sno === "1") ?? null
  const fibaAway = fibaTeams.find((t: any) => t.sno === "2") ?? null

  // Period scores
  const periodScores: Array<{ home: number; away: number }> = []
  if (fibaHome && fibaAway) {
    const numPeriods = Math.max(
      Object.keys(fibaHome?.per ?? {}).length,
      Object.keys(fibaAway?.per ?? {}).length
    )
    for (let p = 1; p <= numPeriods; p++) {
      periodScores.push({
        home: Number(fibaHome?.per?.[p]?.sc ?? 0),
        away: Number(fibaAway?.per?.[p]?.sc ?? 0),
      })
    }
  }

  // Players: FibaLiveStats authoritative, Genius warehouse fallback
  const [geniusHomeRaw, geniusAwayRaw] = await Promise.all([
    geniusFetch(`/matches/${matchId}/teams/${home.id}/players?limit=100`, "long").catch(() => null),
    geniusFetch(`/matches/${matchId}/teams/${away.id}/players?limit=100`, "long").catch(() => null),
  ])

  const extractGenius = (raw: any): BoxscorePlayer[] => {
    const arr: any[] = Array.isArray(raw) ? raw : (raw?.response?.data ?? raw?.data ?? [])
    return arr
      .filter((p: any) => p.periodNumber === 0 || p.periodNumber == null)
      .map(mapPlayer)
  }

  const buildTeamPlayers = (fibaTeam: any, geniusRaw: any): BoxscorePlayer[] => {
    const fiba = fibaTeam?.pl ? Object.values(fibaTeam.pl).map(mapPlayer) : []
    const genius = extractGenius(geniusRaw)
    return dedupePlayers([...fiba, ...genius])
  }

  // Score override desde FibaLiveStats si Genius no lo trae
  if (home.score == null && fibaHome) {
    const s = parseInt(String(fibaHome.score ?? fibaHome.pts ?? ""), 10)
    if (Number.isFinite(s)) home.score = s
  }
  if (away.score == null && fibaAway) {
    const s = parseInt(String(fibaAway.score ?? fibaAway.pts ?? ""), 10)
    if (Number.isFinite(s)) away.score = s
  }

  const homeTeam: BoxscoreTeam = {
    name: home.name, sigla: home.sigla, score: home.score,
    players: buildTeamPlayers(fibaHome, geniusHomeRaw),
  }
  const awayTeam: BoxscoreTeam = {
    name: away.name, sigla: away.sigla, score: away.score,
    players: buildTeamPlayers(fibaAway, geniusAwayRaw),
  }

  const totalPuntos =
    home.score != null && away.score != null ? home.score + away.score : null

  return {
    matchId: String(matchId),
    fecha: parseDateTime(m?.matchTime),
    competicionId: m?.competitionId != null ? String(m.competitionId) : null,
    competicionName: m?.competitionName ?? null,
    equipoLocal: home.name,
    equipoLocalSigla: home.sigla,
    equipoVisit: away.name,
    equipoVisitSigla: away.sigla,
    scoreLocal: home.score,
    scoreVisit: away.score,
    totalPuntos,
    periodScores,
    estadoPartido: m?.matchStatus ?? null,
    home: homeTeam,
    away: awayTeam,
  }
}

/** Convenience: pickLogo exportado por si la UI lo necesita. */
export { pickLogo }
