import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

/**
 * Cross-references match player data (old SPI IDs) with current roster (new SPI IDs).
 * Used to identify players whose stats are stored under a replaced/old SPI ID.
 *
 * GET /api/genius/debug-spi-mismatch
 *
 * Returns for each affected team+game:
 *   - players in match data whose personId is NOT in the current roster
 *   - paired with the current roster player that has the closest matching name
 */

const AFFECTED_GAMES = [5198630, 5198633, 5198634, 5198635, 5198638]
const AFFECTED_TEAM_CODES = ["CIU", "FPC"]

function normName(s: string) {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim()
}

function nameSimilarity(a: string, b: string): number {
  const na = normName(a)
  const nb = normName(b)
  if (na === nb) return 1
  // check last name match
  const partsA = na.split(" ")
  const partsB = nb.split(" ")
  const lastA = partsA[partsA.length - 1]
  const lastB = partsB[partsB.length - 1]
  if (lastA === lastB) return 0.8
  if (na.includes(lastB) || nb.includes(lastA)) return 0.6
  return 0
}

export async function GET() {
  try {
    const { id: compId } = await resolveLnbCompetitionIdPublic()
    if (!compId) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    // Step 1: get all teams from competition to find teamIds for CIU and FPC
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

    const results: any[] = []

    for (const teamCode of AFFECTED_TEAM_CODES) {
      const teamInfo = teamMap.get(teamCode)
      if (!teamInfo) {
        results.push({ teamCode, error: "Team not found in competition" })
        continue
      }
      const { teamId } = teamInfo

      // Step 2: fetch current roster (new SPI IDs)
      const rosterRaw = await geniusFetch(
        `/competitions/${compId}/teams/${teamId}/persons?isPlayer=1&limit=100`,
        "short"
      )
      const rosterPersons: any[] = rosterRaw?.response?.data ?? rosterRaw?.data ?? []
      const currentRoster = rosterPersons.map((p: any) => ({
        personId: p.personId,
        name: normName(`${p.firstName ?? ""} ${p.familyName ?? ""}`),
        firstName: p.firstName,
        familyName: p.familyName,
      }))
      const currentIds = new Set(currentRoster.map((p: any) => p.personId))

      // Step 3: for each affected game, fetch match players for this team
      for (const gameId of AFFECTED_GAMES) {
        // Check if this team played in this game
        const gameMatch = matches.find((m: any) => m.matchId === gameId)
        if (!gameMatch) continue
        const playedInGame = (gameMatch.competitors ?? []).some(
          (c: any) => (c.teamId ?? c.competitorId) === teamId
        )
        if (!playedInGame) continue

        const matchPlayersRaw = await geniusFetch(
          `/matches/${gameId}/players?teamId=${teamId}`,
          "short"
        ).catch(() => null)
        if (!matchPlayersRaw) continue

        const matchPlayers: any[] = matchPlayersRaw?.response?.data ?? matchPlayersRaw?.data ?? []
        // Only totals row (periodNumber=0)
        const totals = matchPlayers.filter((p: any) => p.periodNumber === 0 || p.periodNumber == null)

        for (const mp of totals) {
          const mpId: number = mp.personId
          if (currentIds.has(mpId)) continue // ID is current — no mismatch

          // This player's SPI ID is NOT in the current roster → old/replaced ID
          const mpName = normName(`${mp.firstName ?? mp.personName ?? ""} ${mp.familyName ?? ""}`)

          // Try to find the best name match in current roster
          let bestMatch: any = null
          let bestScore = 0
          for (const rp of currentRoster) {
            const score = nameSimilarity(mpName, rp.name)
            if (score > bestScore) { bestScore = score; bestMatch = rp }
          }

          results.push({
            teamCode,
            teamId,
            gameId,
            oldSpiId: mpId,
            nameInMatch: `${mp.firstName ?? ""} ${mp.familyName ?? mp.personName ?? ""}`.trim(),
            pts: mp.sPoints ?? 0,
            minutes: mp.sMinutes ?? null,
            participated: mp.participated,
            bestRosterMatch: bestMatch
              ? {
                  newSpiId: bestMatch.personId,
                  nameInRoster: `${bestMatch.firstName} ${bestMatch.familyName}`,
                  score: bestScore,
                }
              : null,
          })
        }
      }
    }

    return NextResponse.json({ compId, mismatches: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
