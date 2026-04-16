import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export async function GET() {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    // Try different stats endpoints to see which ones exist and what they return
    const results: Record<string, any> = {}

    const endpoints = [
      `/competitions/${id}/statistics`,
      `/competitions/${id}/player-statistics`,
      `/competitions/${id}/playerstats`,
    ]

    for (const ep of endpoints) {
      try {
        const data = await geniusFetch(ep, "short")
        results[ep] = {
          topLevelKeys: Object.keys(data ?? {}),
          preview: JSON.stringify(data).slice(0, 500),
        }
      } catch (e: any) {
        results[ep] = { error: e.message }
      }
    }

    return NextResponse.json({ competitionId: id, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
