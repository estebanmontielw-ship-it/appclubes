import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import {
  resolveLnbCompetitionIdPublic,
  resolveLnbfCompetitionIdPublic,
  resolveU22MCompetitionIdPublic,
  resolveU22FCompetitionIdPublic,
} from "@/lib/programacion-lnb"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

async function resolveCompetitionIdForLiga(liga: string): Promise<string | null> {
  switch (liga.toLowerCase()) {
    case "lnb": return (await resolveLnbCompetitionIdPublic()).id
    case "lnbf": return (await resolveLnbfCompetitionIdPublic()).id
    case "u22m": return (await resolveU22MCompetitionIdPublic()).id
    case "u22f": return (await resolveU22FCompetitionIdPublic()).id
    default: return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const liga = searchParams.get("liga")
  const competitionIdParam = searchParams.get("competitionId")
  const status = searchParams.get("status")

  try {
    let competitionId = competitionIdParam
    if (!competitionId && liga) {
      competitionId = await resolveCompetitionIdForLiga(liga)
    }
    if (!competitionId) {
      return NextResponse.json({ data: [] })
    }

    const raw = await geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "medium")
    let data: any[] = raw?.response?.data ?? raw?.data ?? []

    if (status) {
      data = data.filter((m: any) => m.matchStatus === status)
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error, { context: "genius/matches" })
  }
}
