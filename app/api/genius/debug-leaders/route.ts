import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

// Debug endpoint to find which stats endpoints return data for the leaders page
// GET /api/genius/debug-leaders
export async function GET() {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const results: Record<string, any> = { competitionId: id }

    // Step 1: get completed matches to find a matchId to test
    let completedMatchId: number | null = null
    try {
      const matchesRaw = await geniusFetch(`/competitions/${id}/matches?limit=50`, "short")
      const matches: any[] =
        matchesRaw?.response?.data ?? matchesRaw?.data ?? (Array.isArray(matchesRaw) ? matchesRaw : [])
      const completed = matches.filter((m: any) => m.matchStatus === "COMPLETE")
      completedMatchId = completed[0]?.matchId ?? null
      results["completedMatches"] = {
        total: completed.length,
        firstMatchId: completedMatchId,
        allMatchIds: completed.map((m: any) => m.matchId),
      }
    } catch (e: any) {
      results["completedMatches"] = { error: e.message }
    }

    // Step 2: test match-level stat endpoints using a real completed match
    if (completedMatchId) {
      const matchEndpoints = [
        `/matches/${completedMatchId}/personstatistics`,
        `/matches/${completedMatchId}/statistics`,
        `/matches/${completedMatchId}/players`,
        `/matches/${completedMatchId}/teamstatistics`,
      ]

      await Promise.all(
        matchEndpoints.map(async (path) => {
          try {
            const data = await geniusFetch(path, "short")
            const items: any[] =
              data?.response?.data ?? data?.data ?? (Array.isArray(data) ? data : [])
            results[path] = {
              ok: true,
              topLevelKeys: Object.keys(data ?? {}),
              itemCount: items.length,
              sample: items.slice(0, 2),
            }
          } catch (e: any) {
            results[path] = { ok: false, error: e.message }
          }
        })
      )
    }

    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
