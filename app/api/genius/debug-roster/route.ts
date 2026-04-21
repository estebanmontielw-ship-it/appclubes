import { NextResponse } from "next/server"
import { geniusFetch, getCompetitionTeamPersons } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { requireRole, isAuthError } from "@/lib/api-auth"

/**
 * Fetch official Genius roster for all teams in the competition.
 * Uses /competitions/{compId}/teams/{teamId}/persons?isPlayer=1&isCurrent=1
 *
 * GET /api/genius/debug-roster           → all teams
 * GET /api/genius/debug-roster?teamId=X  → single team
 */
export async function GET(request: Request) {
  const auth = await requireRole("SUPER_ADMIN")
  if (isAuthError(auth)) return auth
  const { searchParams } = new URL(request.url)
  const teamIdParam = searchParams.get("teamId")

  try {
    const { id: compId } = await resolveLnbCompetitionIdPublic()
    if (!compId) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    // Get all teams in competition
    const matchesRaw = await geniusFetch(`/competitions/${compId}/matches?limit=100`, "short")
    const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
    const teamMap = new Map<number, string>()
    for (const m of matches) {
      for (const c of m.competitors ?? []) {
        const tid = c.teamId ?? c.competitorId
        if (tid) teamMap.set(tid, c.competitorName ?? c.teamName ?? String(tid))
      }
    }

    const teamIds = teamIdParam
      ? [parseInt(teamIdParam)]
      : Array.from(teamMap.keys())

    const results = await Promise.all(
      teamIds.map(async (tid) => {
        try {
          const raw = await geniusFetch(
            `/competitions/${compId}/teams/${tid}/persons?isPlayer=1&limit=100`,
            "short"
          )
          const persons: any[] = raw?.response?.data ?? raw?.data ?? (Array.isArray(raw) ? raw : [])
          return {
            teamId: tid,
            teamName: teamMap.get(tid) ?? String(tid),
            totalPlayers: persons.length,
            rawKeys: raw ? Object.keys(raw) : null,
            rawSample: Array.isArray(raw) ? raw.slice(0, 2) : raw,
            players: persons.map((p: any) => ({
              personId: p.personId,
              firstName: p.firstName,
              familyName: p.familyName,
              shirtNumber: p.shirtNumber ?? p.defaultShirtNumber ?? null,
              nationality: p.nationalityCode ?? null,
            })),
          }
        } catch (e: any) {
          return { teamId: tid, teamName: teamMap.get(tid) ?? String(tid), error: e.message }
        }
      })
    )

    return NextResponse.json({ compId, teams: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
