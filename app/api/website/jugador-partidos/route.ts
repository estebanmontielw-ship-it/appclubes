import { NextResponse } from "next/server"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getGameLog } from "@/lib/jugador-stats"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const personIdStr = searchParams.get("personId")
    if (!personIdStr) return NextResponse.json({ error: "personId requerido" }, { status: 400 })
    const personId = parseInt(personIdStr, 10)
    if (isNaN(personId)) return NextResponse.json({ error: "personId inválido" }, { status: 400 })

    const { id: competitionId } = await resolveLnbCompetitionIdPublic()
    if (!competitionId) return NextResponse.json({ error: "Sin competencia activa" }, { status: 404 })

    const games = await getGameLog(personId, competitionId)

    return NextResponse.json({ games }, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
    })
  } catch (error) {
    return handleApiError(error, { context: "website/jugador-partidos" })
  }
}
