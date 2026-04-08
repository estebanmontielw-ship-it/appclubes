import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export async function GET() {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const raw = await geniusFetch(`/competitions/${id}/matches?limit=5`, "short")
    const items: any[] = raw?.response?.data || raw?.data || (Array.isArray(raw) ? raw : [])

    // Return the first 2 matches with ALL their fields so we can inspect them
    const sample = items.slice(0, 2).map((m) => ({
      matchId: m.matchId,
      matchNumber: m.matchNumber,
      matchDate: m.matchDate,
      matchTime: m.matchTime,
      matchStatus: m.matchStatus,
      round: m.round,
      roundNumber: m.roundNumber,
      matchDayNumber: m.matchDayNumber,
      competitors: (m.competitors ?? []).map((c: any) => ({
        // dump ALL keys so we can see what marker fields exist
        ...c,
      })),
      // dump top-level keys list for discovery
      _topLevelKeys: Object.keys(m),
    }))

    return NextResponse.json({ competitionId: id, sample })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
