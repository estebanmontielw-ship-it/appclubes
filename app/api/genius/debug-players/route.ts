import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export async function GET() {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const matchesRaw = await geniusFetch(`/competitions/${id}/matches?limit=100`, "short")
    const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
    const completed = matches.filter((m: any) => m.matchStatus === "COMPLETE")

    if (completed.length === 0) return NextResponse.json({ error: "No completed matches", allStatuses: matches.map(m => ({ matchId: m.matchId, matchStatus: m.matchStatus })) })

    // Take the first completed match
    const m = completed[0]
    const raw = await geniusFetch(`/matches/${m.matchId}/players`, "short")
    const players: any[] = raw?.response?.data ?? raw?.data ?? []

    // Show key diagnostic fields per player (first 6 players, both teams)
    const sample = players.slice(0, 20).map((p: any) => ({
      personId: p.personId,
      personName: p.personName,
      teamId: p.teamId,
      teamName: p.teamName,
      teamCode: p.teamCode,
      isHomeCompetitor: p.isHomeCompetitor,
      periodNumber: p.periodNumber,
      participated: p.participated,
      sMinutes: p.sMinutes,
      sPoints: p.sPoints,
      _keys: Object.keys(p),
    }))

    return NextResponse.json({
      matchId: m.matchId,
      matchStatus: m.matchStatus,
      competitors: (m.competitors ?? []).map((c: any) => ({ teamId: c.teamId, teamName: c.competitorName, isHome: c.isHomeCompetitor })),
      totalPlayers: players.length,
      sample,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
