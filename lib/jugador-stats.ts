/**
 * Helpers para construir el game log de un jugador específico.
 *
 * Reutilizado por:
 *   - /api/website/jugador-partidos (página pública)
 *   - /api/admin/integridad/jugadores/[id]/detalle (dossier de integridad)
 */

import { geniusFetch, getCompetitions, getSchedule } from "@/lib/genius-sports"
import { normalizeName } from "@/lib/integridad"

export interface GameLogEntry {
  matchId: number
  date: string | null
  isHome: boolean
  oppName: string
  oppSigla: string | null
  myScore: number | null
  oppScore: number | null
  result: "W" | "L" | null
  pos: string | null
  min: string | number | null
  pts: number
  /** Lanzamientos de campo combinados (2pt + 3pt) */
  lcM: number; lcA: number; lcPct: number | null
  twoM: number; twoA: number; twoPct: number | null
  threeM: number; threeA: number; threePct: number | null
  ftM: number; ftA: number; ftPct: number | null
  rebOff: number; rebDef: number; reb: number
  ast: number
  eff: number | null
  stl: number; blk: number
  to: number
  fp: number; fr: number
  plusMinus: number | null
}

/**
 * Resuelve la competencia LNB ACTIVA (con partidos en el schedule).
 *
 * Estrategia:
 *   1. Probar GENIUS_LNB_COMPETITION_ID (env). Si tiene partidos → return.
 *   2. Si está vacía o no seteada, iterar /competitions buscando LNB
 *      (no femenina, no juvenil) ordenadas por year desc.
 *   3. Devolver la primera que tenga partidos.
 *
 * Esto resuelve el caso de que la env var apunte a una temporada vieja
 * (ej. LNB Apertura ya cerrada) y la liga activa sea otra.
 */
export async function resolveActiveLnbCompetition(): Promise<{
  id: string | null
  name: string | null
  matches: any[]
}> {
  // 1. Probar env var primero
  const envId = process.env.GENIUS_LNB_COMPETITION_ID
  if (envId) {
    try {
      const raw: any = await getSchedule(envId)
      const matches: any[] = raw?.response?.data ?? raw?.data ?? []
      if (matches.length > 0) {
        return { id: envId, name: null, matches }
      }
    } catch {
      // env var inválida o sin acceso, seguimos
    }
  }

  // 2. Fallback: buscar la LNB activa entre todas las competencias
  try {
    const raw: any = await getCompetitions()
    const comps: any[] = raw?.response?.data ?? raw?.data ?? []
    const now = new Date().getFullYear()
    const candidates = comps
      .filter((c) => {
        const name = String(c.competitionName ?? "").toUpperCase()
        const isLnb = /LNB|LIGA NACIONAL/i.test(name)
        const isFem = /FEM|MUJER|WOMEN|DAMAS|LNBF/i.test(name)
        const isYouth = /U22|U-22|U19|U17|U15|SUB-/i.test(name)
        return isLnb && !isFem && !isYouth
      })
      .sort((a, b) => {
        // Priorizar año actual, después por proximidad
        const ya = Number(a.year) || 0
        const yb = Number(b.year) || 0
        const dista = Math.abs(now - ya)
        const distb = Math.abs(now - yb)
        if (dista !== distb) return dista - distb
        return yb - ya
      })

    // 3. Probar cada candidato hasta encontrar uno con partidos
    for (const c of candidates) {
      const id = String(c.competitionId)
      try {
        const sched: any = await getSchedule(id)
        const matches: any[] = sched?.response?.data ?? sched?.data ?? []
        if (matches.length > 0) {
          return { id, name: c.competitionName ?? null, matches }
        }
      } catch {
        // skip y probar el siguiente
      }
    }
  } catch {
    // sin acceso al listado de competencias
  }

  // Nada encontrado
  return { id: envId ?? null, name: null, matches: [] }
}

/**
 * Filtro permisivo: un partido está "completado" si Genius lo marca
 * COMPLETE O si tiene scores cargados (porque LNB Paraguay tarda en
 * consolidar el matchStatus, pero los scoreString sí se actualizan).
 */
function isCompletedMatch(m: any): boolean {
  if (m.matchStatus === "COMPLETE") return true
  const competitors: any[] = m.competitors ?? []
  for (const c of competitors) {
    const s = c?.scoreString ? parseInt(c.scoreString, 10) : null
    if (s != null && Number.isFinite(s) && s > 0) return true
  }
  return false
}

/**
 * Construye el game log de un jugador llamando a /matches/{id}/teams/{tid}/players
 * para cada partido completo de la competencia. Maneja correctamente jugadores
 * que cambiaron de equipo a mitad de temporada.
 */
export async function getGameLog(
  personId: number,
  competitionId: string | number
): Promise<GameLogEntry[]> {
  const matchesRaw = await geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "medium")
  const allMatches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
  const completed = allMatches.filter(isCompletedMatch)

  const gameLog: GameLogEntry[] = []

  await Promise.all(
    completed.map(async (match: any) => {
      try {
        const competitors: any[] = match.competitors ?? []
        const teamIds = competitors.map((c: any) => c.teamId ?? c.competitorId).filter(Boolean)
        const teamResults = await Promise.all(
          teamIds.map((tid: any) =>
            geniusFetch(`/matches/${match.matchId}/teams/${tid}/players?limit=100`, "long").catch(() => null)
          )
        )

        for (let i = 0; i < teamResults.length; i++) {
          const result = teamResults[i]
          if (!result) continue
          const players: any[] = result?.response?.data ?? result?.data ?? []
          const player = players.find((p: any) =>
            (p.personId === personId || String(p.personId) === String(personId)) &&
            (p.periodNumber === 0 || p.periodNumber == null)
          )
          if (!player) continue

          const teamId = teamIds[i]
          const myComp = competitors.find((c: any) => String(c.teamId ?? c.competitorId) === String(teamId))
          const oppComp = competitors.find((c: any) => String(c.teamId ?? c.competitorId) !== String(teamId))
          const isHome = Number(myComp?.isHomeCompetitor) === 1

          const myScore = parseInt(myComp?.scoreString ?? "") || null
          const oppScore = parseInt(oppComp?.scoreString ?? "") || null
          const result_: "W" | "L" | null =
            myScore != null && oppScore != null
              ? myScore > oppScore ? "W" : myScore < oppScore ? "L" : null
              : null

          const twoM = player.sTwoPointersMade ?? 0
          const twoA = player.sTwoPointersAttempted ?? 0
          const threeM = player.sThreePointersMade ?? 0
          const threeA = player.sThreePointersAttempted ?? 0
          const ftM = player.sFreeThrowsMade ?? 0
          const ftA = player.sFreeThrowsAttempted ?? 0
          const lcM = twoM + threeM
          const lcA = twoA + threeA

          gameLog.push({
            matchId: match.matchId,
            date: (match.matchTime ?? "").split(" ")[0] ?? null,
            isHome,
            oppName: oppComp?.competitorName ?? oppComp?.teamName ?? "?",
            oppSigla: oppComp?.teamCode ?? null,
            myScore, oppScore,
            result: result_,
            pos: player.positionName ?? player.position ?? null,
            min: player.sMinutes ?? null,
            pts: player.sPoints ?? 0,
            lcM, lcA,
            lcPct: lcA > 0 ? Math.round((lcM / lcA) * 1000) / 10 : null,
            twoM, twoA,
            twoPct: twoA > 0 ? Math.round((twoM / twoA) * 1000) / 10 : null,
            threeM, threeA,
            threePct: threeA > 0 ? Math.round((threeM / threeA) * 1000) / 10 : null,
            ftM, ftA,
            ftPct: ftA > 0 ? Math.round((ftM / ftA) * 1000) / 10 : null,
            rebOff: player.sReboundsOffensive ?? 0,
            rebDef: player.sReboundsDefensive ?? 0,
            reb: player.sReboundsTotal ?? 0,
            ast: player.sAssists ?? 0,
            eff: player.sEfficiency ?? null,
            stl: player.sSteals ?? 0,
            blk: player.sBlocks ?? 0,
            to: player.sTurnovers ?? 0,
            fp: player.sFoulsPersonal ?? 0,
            fr: player.sFoulsOn ?? 0,
            plusMinus: player.sPlusMinus ?? null,
          })
          break
        }
      } catch {
        // skip this match on error
      }
    })
  )

  gameLog.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
  return gameLog
}

/**
 * Descubre el personId de un jugador iterando los rosters de los partidos
 * completos de la competencia.
 *
 * Estrategia de matching (en orden, ante el primer match positivo retorna):
 *   1. Match exacto del nombre completo normalizado
 *   2. Match exacto del apellido (Familia/last name)
 *   3. Substring: el nombre tier está contenido en el de Genius (o viceversa)
 *   4. Cualquier token (palabra) del nombre tier matchea exactamente con
 *      uno del de Genius — útil para apodos / segundo nombre / variaciones
 *      ortográficas (Jefferson vs Jeferson)
 *
 * Si se pasa `clubSigla`, prioriza buscar primero en partidos donde aparezca
 * ese equipo, agilizando el discovery.
 */
export async function discoverPersonId(
  nombreNorm: string,
  competitionId: string | number,
  clubSigla?: string | null
): Promise<number | null> {
  const matchesRaw = await geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "medium")
  const allMatches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
  const completed = allMatches.filter(isCompletedMatch)

  // Si tenemos sigla del club, priorizar partidos donde juegue ese equipo
  const sortedMatches = clubSigla
    ? [...completed].sort((a, b) => {
        const aHasClub = (a.competitors ?? []).some((c: any) => (c.teamCode ?? "").toUpperCase() === clubSigla.toUpperCase())
        const bHasClub = (b.competitors ?? []).some((c: any) => (c.teamCode ?? "").toUpperCase() === clubSigla.toUpperCase())
        if (aHasClub === bHasClub) return 0
        return aHasClub ? -1 : 1
      })
    : completed

  // Tokens del nombre tier para matching alternativo
  const tierTokens = nombreNorm.split(/\s+/).filter(t => t.length >= 3)

  // Pasada 1: match exacto
  // Pasada 2: substring / tokens compartidos
  // Para evitar 2× iteraciones, recolectamos en una sola pasada
  let exactMatch: number | null = null
  let lastNameMatch: number | null = null
  let substringMatch: number | null = null
  let tokenMatch: number | null = null

  for (const match of sortedMatches) {
    if (exactMatch != null) break
    const competitors: any[] = match.competitors ?? []
    const teamIds = competitors.map((c: any) => c.teamId ?? c.competitorId).filter(Boolean)
    const teamResults = await Promise.all(
      teamIds.map((tid: any) =>
        geniusFetch(`/matches/${match.matchId}/teams/${tid}/players?limit=100`, "long").catch(() => null)
      )
    )

    for (const result of teamResults) {
      if (!result) continue
      const players: any[] = result?.response?.data ?? result?.data ?? []
      for (const p of players) {
        if (p.periodNumber !== 0 && p.periodNumber != null) continue
        if (!p.personId) continue
        const fullName: string = (p.personName ?? `${p.firstName ?? ""} ${p.familyName ?? ""}`).trim()
        const familyName: string = String(p.familyName ?? "").trim()
        const playerNorm = normalizeName(fullName)
        const familyNorm = normalizeName(familyName)
        const playerTokens = playerNorm.split(/\s+/).filter(t => t.length >= 3)

        if (playerNorm === nombreNorm) {
          exactMatch = Number(p.personId)
          break
        }
        if (lastNameMatch == null && familyNorm && tierTokens.some(t => t === familyNorm)) {
          lastNameMatch = Number(p.personId)
        }
        if (substringMatch == null && playerNorm.length > 3 && (playerNorm.includes(nombreNorm) || nombreNorm.includes(playerNorm))) {
          substringMatch = Number(p.personId)
        }
        if (tokenMatch == null && tierTokens.length >= 1 && playerTokens.length >= 1) {
          // Necesitan al menos 2 tokens compartidos para evitar falsos positivos en jugadores con apellido común
          const shared = tierTokens.filter(t => playerTokens.includes(t)).length
          if (shared >= 2) tokenMatch = Number(p.personId)
        }
      }
    }
  }

  return exactMatch ?? lastNameMatch ?? substringMatch ?? tokenMatch
}
