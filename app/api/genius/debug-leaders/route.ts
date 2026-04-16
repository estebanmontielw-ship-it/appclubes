import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export async function GET(request: Request) {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    // Allow testing different stat codes via ?codes=PTS,REB,AST
    const codes = searchParams.get("codes") ?? "points,rebounds,assists,steals,blocks"

    // Correct endpoint per Genius Sports docs:
    // /competitions/{id}/leaders/summary?statisticCodes=...
    const results: Record<string, any> = {}

    // Try a few common code formats since docs don't specify exact codes
    const attempts = [
      codes,
      "PTS,REB,AST",
      "points,rebounds,assists",
      "pointsPerGame,reboundsPerGame,assistsPerGame",
    ]

    for (const statCodes of attempts) {
      const path = `/competitions/${id}/leaders/summary?statisticCodes=${encodeURIComponent(statCodes)}&limit=10`
      try {
        const data = await geniusFetch(path, "short")
        results[statCodes] = {
          ok: true,
          topLevelKeys: Object.keys(data ?? {}),
          preview: JSON.stringify(data).slice(0, 2000),
        }
      } catch (e: any) {
        results[statCodes] = { ok: false, error: e.message }
      }
    }

    return NextResponse.json({ competitionId: id, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
