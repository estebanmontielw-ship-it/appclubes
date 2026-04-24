import { NextResponse } from "next/server"
import { getAllPlayerStats } from "@/lib/genius-sports"
import {
  resolveLnbCompetitionIdPublic,
  resolveLnbfCompetitionIdPublic,
} from "@/lib/programacion-lnb"

export const revalidate = 600

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const competition = (searchParams.get("competition") ?? "lnb").toLowerCase()
    const explicitId = searchParams.get("competitionId")

    let id: string | null = explicitId
    if (!id) {
      const resolver =
        competition === "lnbf"
          ? resolveLnbfCompetitionIdPublic
          : resolveLnbCompetitionIdPublic
      id = (await resolver()).id
    }
    if (!id) return NextResponse.json({ players: [], teams: [] })

    const data = await getAllPlayerStats(id)
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, players: [], teams: [] }, { status: 500 })
  }
}
