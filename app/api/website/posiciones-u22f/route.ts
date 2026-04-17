import { NextResponse } from "next/server"
import { resolveU22FCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getStandings } from "@/lib/genius-sports"
import { handleApiError } from "@/lib/api-errors"
import type { StandingRow } from "@/components/website/LNBStandings"

function normalizeStandings(raw: any): StandingRow[] {
  const items: any[] = raw?.response?.data ?? raw?.data ?? (Array.isArray(raw) ? raw : [])
  return items.map((item: any, idx: number): StandingRow => {
    const comp = item.competitor ?? item.team ?? item
    const stats = item.stats ?? item
    const logo =
      comp?.images?.logo?.T1?.url ??
      comp?.images?.logo?.S1?.url ??
      comp?.logoUrl ??
      null
    return {
      rank: item.rank ?? item.position ?? idx + 1,
      teamId: comp?.competitorId ?? comp?.teamId ?? comp?.id ?? idx,
      teamName: comp?.competitorName ?? comp?.teamName ?? comp?.name ?? "Equipo",
      teamSigla: comp?.teamCode ?? comp?.sigla ?? null,
      teamLogo: logo,
      gamesPlayed: stats?.gamesPlayed ?? stats?.played ?? 0,
      wins: stats?.wins ?? stats?.won ?? 0,
      losses: stats?.losses ?? stats?.lost ?? 0,
      winPct: (stats?.played ?? stats?.gamesPlayed ?? 0) > 0
        ? (stats?.wins ?? stats?.won ?? 0) / (stats?.played ?? stats?.gamesPlayed)
        : null,
      pointsFor: stats?.scoredFor ?? stats?.pointsFor ?? stats?.ptsFor ?? null,
      pointsAgainst: stats?.scoredAgainst ?? stats?.pointsAgainst ?? stats?.ptsAgainst ?? null,
      pointDiff:
        stats?.pointsDiff ??
        stats?.pointDifferential ??
        stats?.pointDiff ??
        (stats?.scoredFor != null && stats?.scoredAgainst != null
          ? stats.scoredFor - stats.scoredAgainst
          : null),
    }
  })
}


export async function GET() {
  try {
    const { id: competitionId, name: competitionName } = await resolveU22FCompetitionIdPublic()
    if (!competitionId) {
      throw new Error("No se encontró la competencia U22 Femenino. Definí GENIUS_U22F_COMPETITION_ID.")
    }

    const sRaw = await getStandings(competitionId)
    const standings = normalizeStandings(sRaw).sort((a, b) => a.rank - b.rank)

    return NextResponse.json(
      { competition: { id: competitionId, name: competitionName ?? "U22 Femenino" }, standings },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (error: any) {
    return handleApiError(error, { context: "website/posiciones-u22f" })
  }
}
