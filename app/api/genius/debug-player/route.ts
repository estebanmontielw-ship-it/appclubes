import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { LNB_ROSTERS } from "@/lib/rosters-lnb"
import { requireRole, isAuthError } from "@/lib/api-auth"

/** Normalize for name matching: uppercase, remove accents, collapse spaces */
function normName(s: string) {
  return s
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Debug: cross-reference official LNB rosters with Genius Sports match stats (by name).
 *
 * GET /api/genius/debug-player            → full cross-reference report for all teams
 * GET /api/genius/debug-player?personId=X → search a Genius personId across all matches
 * GET /api/genius/debug-player?name=ALVARO+DOMINGUEZ → search a player by name
 */
export async function GET(request: Request) {
  const auth = await requireRole("SUPER_ADMIN")
  if (isAuthError(auth)) return auth
  const { searchParams } = new URL(request.url)
  const personIdStr = searchParams.get("personId")
  const nameQuery = searchParams.get("name")

  try {
    const { id: compId } = await resolveLnbCompetitionIdPublic()
    if (!compId) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const matchesRaw = await geniusFetch(`/competitions/${compId}/matches?limit=100`, "short")
    const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
    const completed = matches.filter((m: any) => m.matchStatus === "COMPLETE")

    // Collect all players seen across every completed match (by Genius personId and by name)
    const seenByGeniusId = new Map<number, any>()
    const seenByName = new Map<string, any>()
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
              const raw = await geniusFetch(`/matches/${m.matchId}/teams/${tid}/players?limit=100`, "short")
              const players: any[] = raw?.response?.data ?? raw?.data ?? []
              allPlayers.push(...players)
            } catch { /* ignore */ }
          })
        )
        for (const p of allPlayers) {
          if (p.personId) seenByGeniusId.set(p.personId, p)
          const fullName = normName(`${p.firstName ?? ""} ${p.familyName ?? p.personName ?? ""}`)
          if (fullName) seenByName.set(fullName, p)
        }
        matchPlayerData.push({ matchId: m.matchId, matchNumber: m.matchNumber, matchTime: m.matchTime, players: allPlayers })
      })
    )

    // Single-player by Genius personId
    if (personIdStr) {
      const personId = parseInt(personIdStr)
      const foundInMatches: any[] = []
      const notFoundInMatchIds: number[] = []
      for (const md of matchPlayerData) {
        const found = md.players.filter((p: any) => p.personId === personId)
        if (found.length > 0) foundInMatches.push({ ...md, records: found })
        else notFoundInMatchIds.push(md.matchId)
      }
      return NextResponse.json({
        personId,
        appearsInGenius: seenByGeniusId.has(personId),
        playerInfo: seenByGeniusId.get(personId) ?? null,
        completedMatchesChecked: completed.length,
        foundInMatches,
        notFoundInMatchIds,
      })
    }

    // Single-player by name
    if (nameQuery) {
      const needle = normName(nameQuery)
      const geniusPlayer = seenByName.get(needle) ?? null
      const foundInMatches: any[] = []
      for (const md of matchPlayerData) {
        const found = md.players.filter((p: any) => {
          const n = normName(`${p.firstName ?? ""} ${p.familyName ?? p.personName ?? ""}`)
          return n === needle
        })
        if (found.length > 0) foundInMatches.push({ ...md, records: found })
      }
      return NextResponse.json({ nameQuery, normalizedQuery: needle, geniusPlayer, foundInMatches })
    }

    // Full cross-reference by name (FIBA Organizer roster vs Genius match data)
    const report = LNB_ROSTERS.map(team => {
      const results = team.players.map(p => {
        const needle = normName(`${p.firstName} ${p.lastName}`)
        const geniusMatch = seenByName.get(needle) ?? null
        return {
          fiba_personId: p.personId,
          name: `${p.firstName} ${p.lastName}`,
          normalizedName: needle,
          foundInGenius: geniusMatch !== null,
          genius_personId: geniusMatch?.personId ?? null,
          genius_teamName: geniusMatch?.teamName ?? null,
        }
      })
      const found = results.filter(r => r.foundInGenius)
      const missing = results.filter(r => !r.foundInGenius)
      return {
        teamName: team.teamName,
        totalRegistered: team.players.length,
        foundInGenius: found.length,
        missingFromGenius: missing.length,
        players: results,
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
      note: "Matching by normalized name (FIBA Organizer personIds ≠ Genius personIds)",
      teams: report,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
