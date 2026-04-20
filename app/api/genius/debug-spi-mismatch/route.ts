import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

/**
 * Diagnostics: shows exactly what Genius Warehouse returns for CIU and FPC
 * players in the affected games, to identify why some show PJ=0.
 *
 * GET /api/genius/debug-spi-mismatch
 */

const AFFECTED_GAMES = [5198630, 5198633, 5198634, 5198635, 5198638]
const AFFECTED_TEAM_CODES = ["CIU", "FPC"]

function normName(s: string) {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim()
}

export async function GET() {
  try {
    const { id: compId } = await resolveLnbCompetitionIdPublic()
    if (!compId) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    // Get all teams from competition
    const matchesRaw = await geniusFetch(`/competitions/${compId}/matches?limit=100`, "short")
    const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []

    const teamMap = new Map<string, { teamId: number; teamName: string }>()
    for (const m of matches) {
      for (const c of m.competitors ?? []) {
        const code = c.teamCode ?? ""
        const tid = c.teamId ?? c.competitorId
        if (code && tid && !teamMap.has(code)) {
          teamMap.set(code, { teamId: tid, teamName: c.competitorName ?? code })
        }
      }
    }

    // Show what team codes exist so we can confirm CIU/FPC are correct
    const allTeamCodes = Array.from(teamMap.entries()).map(([code, info]) => ({
      code,
      teamId: info.teamId,
      teamName: info.teamName,
    }))

    const results: any[] = []

    for (const teamCode of AFFECTED_TEAM_CODES) {
      const teamInfo = teamMap.get(teamCode)
      if (!teamInfo) {
        results.push({ teamCode, error: `Not found in competition. Available codes: ${allTeamCodes.map(t => t.code).join(", ")}` })
        continue
      }
      const { teamId } = teamInfo

      // Fetch current roster
      const rosterRaw = await geniusFetch(
        `/competitions/${compId}/teams/${teamId}/persons?isPlayer=1&limit=100`,
        "short"
      )
      const rosterPersons: any[] = rosterRaw?.response?.data ?? rosterRaw?.data ?? []
      const currentRoster = rosterPersons.map((p: any) => ({
        personId: p.personId,
        name: `${p.firstName ?? ""} ${p.familyName ?? ""}`.trim(),
      }))
      const rosterById = new Map(currentRoster.map(p => [p.personId, p.name]))

      for (const gameId of AFFECTED_GAMES) {
        const gameMatch = matches.find((m: any) => m.matchId === gameId)
        if (!gameMatch) continue
        const playedInGame = (gameMatch.competitors ?? []).some(
          (c: any) => (c.teamId ?? c.competitorId) === teamId
        )
        if (!playedInGame) continue

        const raw = await geniusFetch(`/matches/${gameId}/players?teamId=${teamId}`, "short").catch(() => null)
        const allPlayers: any[] = raw?.response?.data ?? raw?.data ?? []
        const totals = allPlayers.filter((p: any) => p.periodNumber === 0 || p.periodNumber == null)

        results.push({
          teamCode,
          teamId,
          gameId,
          gameDate: gameMatch.matchTime?.split(" ")[0] ?? null,
          playersInMatchData: totals.map((p: any) => ({
            personId: p.personId,
            name: `${p.firstName ?? ""} ${p.familyName ?? p.personName ?? ""}`.trim(),
            inCurrentRoster: rosterById.has(p.personId),
            rosterName: rosterById.get(p.personId) ?? null,
            participated: p.participated,
            sMinutes: p.sMinutes,
            sPoints: p.sPoints,
            sTwoPointersAttempted: p.sTwoPointersAttempted,
            sThreePointersAttempted: p.sThreePointersAttempted,
            sFreeThrowsAttempted: p.sFreeThrowsAttempted,
            sReboundsTotal: p.sReboundsTotal,
            sAssists: p.sAssists,
          })),
        })
      }
    }

    return NextResponse.json({ compId, allTeamCodes, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
