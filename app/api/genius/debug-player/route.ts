import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

/**
 * Debug: find a specific player by personId across all matches + direct API probes
 * GET /api/genius/debug-player?personId=7039133
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const personIdStr = searchParams.get("personId")
  if (!personIdStr) return NextResponse.json({ error: "personId param required" }, { status: 400 })
  const personId = parseInt(personIdStr)

  try {
    const { id: compId } = await resolveLnbCompetitionIdPublic()
    if (!compId) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    // 1. Try direct Genius Sports player endpoints
    const directProbes: Record<string, any> = {}
    const probePaths = [
      `/persons/${personId}`,
      `/players/${personId}`,
      `/competitions/${compId}/players/${personId}`,
      `/competitions/${compId}/persons/${personId}`,
    ]
    await Promise.all(
      probePaths.map(async (p) => {
        try {
          directProbes[p] = await geniusFetch(p, "short")
        } catch (e: any) {
          directProbes[p] = { error: e.message }
        }
      })
    )

    // 2. Search through all completed matches for this personId
    const matchesRaw = await geniusFetch(`/competitions/${compId}/matches?limit=100`, "short")
    const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
    const completed = matches.filter((m: any) => m.matchStatus === "COMPLETE")

    const foundInMatches: any[] = []
    const notFoundInMatches: number[] = []

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
        const found = allPlayers.filter((p: any) => p.personId === personId)
        if (found.length > 0) {
          foundInMatches.push({
            matchId: m.matchId,
            matchNumber: m.matchNumber,
            matchTime: m.matchTime,
            records: found,
          })
        } else {
          notFoundInMatches.push(m.matchId)
        }
      })
    )

    return NextResponse.json({
      personId,
      compId,
      completedMatchesChecked: completed.length,
      foundInMatches,
      notFoundInMatchIds: notFoundInMatches,
      directApiProbes: directProbes,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
