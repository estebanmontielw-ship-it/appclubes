import { NextResponse } from "next/server"
import { resolveLnbfCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getStandings } from "@/lib/genius-sports"
import { handleApiError } from "@/lib/api-errors"
import { normalizeStandings } from "@/lib/normalize-standings"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { id: competitionId, name: competitionName } = await resolveLnbfCompetitionIdPublic()
    if (!competitionId) {
      throw new Error("No se encontró la competencia LNB Femenino. Definí GENIUS_LNBF_COMPETITION_ID.")
    }

    const sRaw = await getStandings(competitionId)
    const standings = normalizeStandings(sRaw).sort((a, b) => a.rank - b.rank)

    return NextResponse.json(
      { competition: { id: competitionId, name: competitionName ?? "LNB Femenino" }, standings },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (error: any) {
    return handleApiError(error, { context: "website/posiciones-lnbf" })
  }
}
