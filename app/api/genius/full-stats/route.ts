import { NextResponse } from "next/server"
import { getAllPlayerStats } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export const revalidate = 300

export async function GET() {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ players: [], teams: [] })

    const data = await getAllPlayerStats(id)
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, players: [], teams: [] }, { status: 500 })
  }
}
