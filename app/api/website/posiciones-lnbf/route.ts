import { NextResponse } from "next/server"
import { computeStandingsFromMatches, loadLnbfSchedule } from "@/lib/programacion-lnb"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { competition, matches, teams } = await loadLnbfSchedule()
    const standings = computeStandingsFromMatches(matches, teams)

    return NextResponse.json(
      { competition: { id: competition.id, name: competition.name ?? "LNB Femenino" }, standings },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (error: any) {
    return handleApiError(error, { context: "website/posiciones-lnbf" })
  }
}
