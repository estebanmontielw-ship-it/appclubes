import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export async function GET() {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const raw = await geniusFetch(`/competitions/${id}/leaders`, "short")

    return NextResponse.json({
      competitionId: id,
      topLevelKeys: Object.keys(raw ?? {}),
      raw,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
