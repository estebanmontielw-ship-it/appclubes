import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export async function GET() {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    // Get completed matches to find a valid matchId
    const schedule = await geniusFetch(`/competitions/${id}/matches?limit=100`, "short")
    const matches: any[] = schedule?.response?.data ?? schedule?.data ?? []
    const completed = matches.filter((m: any) => m.matchStatus === "COMPLETE")

    if (!completed.length) {
      return NextResponse.json({ error: "No completed matches yet", total: matches.length })
    }

    // Fetch stats for the first completed match
    const sample = completed[0]
    const matchId = sample.matchId
    let matchStats: any = null
    let matchStatsError: string | null = null

    try {
      matchStats = await geniusFetch(`/matches/${matchId}/statistics`, "short")
    } catch (e: any) {
      matchStatsError = e.message
    }

    return NextResponse.json({
      competitionId: id,
      completedMatchCount: completed.length,
      sampleMatchId: matchId,
      matchStatsError,
      matchStats,
      matchStatsTopKeys: matchStats ? Object.keys(matchStats) : [],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
