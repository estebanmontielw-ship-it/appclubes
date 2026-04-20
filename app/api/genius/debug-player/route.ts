import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { LNB_ROSTERS, PLAYER_BY_ID } from "@/lib/rosters-lnb"

/**
 * Debug: cross-reference official LNB rosters with Genius Sports match stats.
 *
 * GET /api/genius/debug-player            → full cross-reference report for all teams
 * GET /api/genius/debug-player?personId=X → search a single player across all matches
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const personIdStr = searchParams.get("personId")

  try {
    const { id: compId } = await resolveLnbCompetitionIdPublic()
    if (!compId) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const matchesRaw = await geniusFetch(`/competitions/${compId}/matches?limit=100`, "short")
    const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
    const completed = matches.filter((m: any) => m.matchStatus === "COMPLETE")

    // Collect all personIds seen across every completed match
    const seenPersonIds = new Set<number>()
    const matchPlayerData: Array<{ matchId: number; matchNumber: number; matchTime: string; players: any[] }> = []

    await Promise.all(
      completed.map(async (m: any) => {
        const teamIds: number[] = (m.competitors ?? [])
          .map((c: any) => c.teamId ?? c.competitorId)
          .filter(Boolean)
        const allPlayers: any[] = []
        await Promise.all(
          teamIds.map(async (tid: number) => {
            try {
              const raw = await geniusFetch(`/matches/${m.matchId}/players?teamId=${tid}`, "short")
              const players: any[] = raw?.response?.data ?? raw?.data ?? []
              allPlayers.push(...players)
            } catch { /* ignore */ }
          })
        )
        for (const p of allPlayers) {
          if (p.personId) seenPersonIds.add(p.personId)
        }
        matchPlayerData.push({ matchId: m.matchId, matchNumber: m.matchNumber, matchTime: m.matchTime, players: allPlayers })
      })
    )

    // Single-player mode
    if (personIdStr) {
      const personId = parseInt(personIdStr)
      const rosterEntry = PLAYER_BY_ID.get(personId) ?? null
      const foundInMatches: any[] = []
      const notFoundInMatchIds: number[] = []

      for (const md of matchPlayerData) {
        const found = md.players.filter((p: any) => p.personId === personId)
        if (found.length > 0) {
          foundInMatches.push({ matchId: md.matchId, matchNumber: md.matchNumber, matchTime: md.matchTime, records: found })
        } else {
          notFoundInMatchIds.push(md.matchId)
        }
      }

      // Probe direct Genius endpoints
      const directProbes: Record<string, any> = {}
      const probePaths = [
        `/persons/${personId}`,
        `/players/${personId}`,
        `/competitions/${compId}/players/${personId}`,
        `/competitions/${compId}/persons/${personId}`,
      ]
      await Promise.all(
        probePaths.map(async (p) => {
          try { directProbes[p] = await geniusFetch(p, "short") }
          catch (e: any) { directProbes[p] = { error: e.message } }
        })
      )

      return NextResponse.json({
        personId,
        rosterEntry,
        inOfficialRoster: rosterEntry !== null,
        appearsInGenius: seenPersonIds.has(personId),
        completedMatchesChecked: completed.length,
        foundInMatches,
        notFoundInMatchIds,
        directApiProbes: directProbes,
      })
    }

    // Full cross-reference mode: show missing players per team
    const report = LNB_ROSTERS.map(team => {
      const missing = team.players.filter(p => !seenPersonIds.has(p.personId))
      const found = team.players.filter(p => seenPersonIds.has(p.personId))
      return {
        teamName: team.teamName,
        totalRegistered: team.players.length,
        foundInGenius: found.length,
        missingFromGenius: missing.length,
        missingPlayers: missing.map(p => ({
          personId: p.personId,
          name: `${p.firstName} ${p.lastName}`,
          debugUrl: `/api/genius/debug-player?personId=${p.personId}`,
        })),
      }
    })

    const totalMissing = report.reduce((s, t) => s + t.missingFromGenius, 0)
    const totalRegistered = report.reduce((s, t) => s + t.totalRegistered, 0)

    return NextResponse.json({
      compId,
      completedMatchesChecked: completed.length,
      totalRegistered,
      totalFoundInGenius: totalRegistered - totalMissing,
      totalMissingFromGenius: totalMissing,
      teams: report,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
