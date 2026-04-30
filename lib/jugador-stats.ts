/**
 * Helpers para construir el game log de un jugador específico.
 *
 * Reutilizado por:
 *   - /api/website/jugador-partidos (página pública)
 *   - /api/admin/integridad/jugadores/[id]/detalle (dossier de integridad)
 */

import { geniusFetch } from "@/lib/genius-sports"
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
  const completed = allMatches.filter((m: any) => m.matchStatus === "COMPLETE")

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
 * completos de la competencia. Devuelve null si no se encuentra.
 */
export async function discoverPersonId(
  nombreNorm: string,
  competitionId: string | number
): Promise<number | null> {
  const matchesRaw = await geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "medium")
  const allMatches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
  const completed = allMatches.filter((m: any) => m.matchStatus === "COMPLETE")

  // Iterar partidos y buscar el primer match con el nombre normalizado
  for (const match of completed) {
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
        const fullName: string = (p.personName ?? `${p.firstName ?? ""} ${p.familyName ?? ""}`).trim()
        if (normalizeName(fullName) === nombreNorm && p.personId) {
          return Number(p.personId)
        }
      }
    }
  }
  return null
}
