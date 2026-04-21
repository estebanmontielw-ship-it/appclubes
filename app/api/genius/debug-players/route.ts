import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { requireRole, isAuthError } from "@/lib/api-auth"

export async function GET() {
  const auth = await requireRole("SUPER_ADMIN")
  if (isAuthError(auth)) return auth
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const matchesRaw = await geniusFetch(`/competitions/${id}/matches?limit=100`, "short")
    const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
    const completed = matches.filter((m: any) => m.matchStatus === "COMPLETE")

    if (completed.length === 0) return NextResponse.json({ error: "No completed matches" })

    const m = completed[0]
    const teamIds: number[] = (m.competitors ?? []).map((c: any) => c.teamId ?? c.competitorId).filter(Boolean)

    // Test both: without teamId and with ?teamId per team
    const [rawAll, ...rawPerTeam] = await Promise.all([
      geniusFetch(`/matches/${m.matchId}/players`, "short").catch(() => null),
      ...teamIds.map((tid: number) =>
        geniusFetch(`/matches/${m.matchId}/teams/${tid}/players?limit=100`, "short").catch(() => null)
      ),
    ])

    const allPlayers: any[] = rawAll?.response?.data ?? rawAll?.data ?? []
    const perTeamPlayers = rawPerTeam.map((r: any, i: number) => {
      const players: any[] = r?.response?.data ?? r?.data ?? []
      return {
        teamId: teamIds[i],
        count: players.length,
        sample: players.slice(0, 5).map((p: any) => ({
          personId: p.personId,
          personName: p.personName,
          firstName: p.firstName, familyName: p.familyName,
          teamId: p.teamId, teamName: p.teamName,
          periodNumber: p.periodNumber, participated: p.participated,
          sMinutes: p.sMinutes, sPoints: p.sPoints,
        })),
      }
    })

    return NextResponse.json({
      matchId: m.matchId,
      competitors: (m.competitors ?? []).map((c: any) => ({
        teamId: c.teamId, teamName: c.competitorName ?? c.teamName, isHome: c.isHomeCompetitor,
      })),
      withoutTeamId: {
        totalPlayers: allPlayers.length,
        teams: Array.from(new Set(allPlayers.map((p: any) => p.teamName))),
      },
      perTeam: perTeamPlayers,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
