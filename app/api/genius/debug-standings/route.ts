import { NextResponse } from "next/server"
import { getStandings } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic, resolveU22FCompetitionIdPublic } from "@/lib/programacion-lnb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const comp = searchParams.get("comp") ?? "lnb"

    let id: string | number | null
    if (comp === "u22f") {
      const res = await resolveU22FCompetitionIdPublic()
      id = res.id
    } else {
      const res = await resolveLnbCompetitionIdPublic()
      id = res.id
    }
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const standings = await getStandings(id)
    const leaders = { note: "getLeaders removed — use /api/genius/debug-leaders" }

    const standingsItems: any[] = standings?.response?.data ?? standings?.data ?? (Array.isArray(standings) ? standings : [])
    const firstItem = standingsItems[0] ?? null
    const statsObj = firstItem?.stats ?? firstItem ?? null

    return NextResponse.json({
      competitionId: id,
      competition: comp,
      standings: {
        raw: standings,
        itemCount: standingsItems.length,
        sampleItem: firstItem,
        topLevelKeys: firstItem ? Object.keys(firstItem) : [],
        statsKeys: statsObj ? Object.keys(statsObj) : [],
        statsValues: statsObj,
      },
      leaders: {
        raw: leaders,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
