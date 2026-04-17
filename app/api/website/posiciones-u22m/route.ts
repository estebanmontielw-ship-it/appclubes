import { NextResponse } from "next/server"
import { resolveU22MCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getStandings } from "@/lib/genius-sports"
import { handleApiError } from "@/lib/api-errors"
import { normalizeStandings } from "@/lib/normalize-standings"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { id: competitionId, name: competitionName } = await resolveU22MCompetitionIdPublic()
    if (!competitionId) {
      throw new Error("No se encontró la competencia U22 Masculino. Definí GENIUS_U22M_COMPETITION_ID.")
    }

    const sRaw = await getStandings(competitionId)
    const standings = normalizeStandings(sRaw).sort((a, b) => a.rank - b.rank)

    return NextResponse.json(
      { competition: { id: competitionId, name: competitionName ?? "U22 Masculino" }, standings },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (error: any) {
    return handleApiError(error, { context: "website/posiciones-u22m" })
  }
}
