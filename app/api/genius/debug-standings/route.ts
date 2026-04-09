import { NextResponse } from "next/server"
import { getStandings, getLeaders } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export async function GET() {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const [standings, leaders] = await Promise.all([
      getStandings(id),
      getLeaders(id).catch((e: any) => ({ error: e.message })),
    ])

    const standingsItems: any[] = standings?.response?.data ?? standings?.data ?? (Array.isArray(standings) ? standings : [])

    return NextResponse.json({
      competitionId: id,
      standings: {
        raw: standings,
        itemCount: standingsItems.length,
        sampleItem: standingsItems[0] ?? null,
        topLevelKeys: standingsItems[0] ? Object.keys(standingsItems[0]) : [],
      },
      leaders: {
        raw: leaders,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
