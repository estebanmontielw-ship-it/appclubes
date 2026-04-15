import { NextResponse } from "next/server"
import { resolveU22FCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getStandings, getLeaders } from "@/lib/genius-sports"
import { handleApiError } from "@/lib/api-errors"
import type { StandingRow, LeaderEntry } from "@/components/website/LNBStandings"

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
      winPct: stats?.winPercentage ?? stats?.winPct ?? null,
      pointsFor: stats?.pointsFor ?? stats?.ptsFor ?? null,
      pointsAgainst: stats?.pointsAgainst ?? stats?.ptsAgainst ?? null,
      pointDiff:
        stats?.pointDifferential ??
        stats?.pointDiff ??
        (stats?.pointsFor != null && stats?.pointsAgainst != null
          ? stats.pointsFor - stats.pointsAgainst
          : null),
    }
  })
}

function extractLeaderCategory(raw: any, statKey: string, statLabel: string): LeaderEntry[] {
  const section = raw?.response?.data ?? raw?.data ?? (Array.isArray(raw) ? raw : [])
  let entries: any[] = []
  if (Array.isArray(section)) {
    const found = section.find(
      (s: any) =>
        String(s.statName ?? s.stat ?? s.category ?? "").toLowerCase().includes(statKey.toLowerCase())
    )
    entries = found?.leaders ?? found?.players ?? found?.data ?? []
    if (!entries.length && section.length > 0 && section[0]?.player) entries = section
  }
  return entries.slice(0, 5).map((e: any, idx: number): LeaderEntry => {
    const player = e.player ?? e.competitor ?? e
    const team = e.team ?? e.competitor?.team ?? {}
    const logo = team?.images?.logo?.T1?.url ?? team?.images?.logo?.S1?.url ?? team?.logoUrl ?? null
    const value = e[statKey] ?? e.average ?? e.value ?? e.stat ?? 0
    return {
      rank: e.rank ?? idx + 1,
      playerName:
        player?.playerName ??
        player?.name ??
        [player?.firstName, player?.lastName].filter(Boolean).join(" ") ??
        "Jugador",
      teamName: team?.teamName ?? team?.name ?? team?.competitorName ?? "",
      teamSigla: team?.teamCode ?? team?.sigla ?? null,
      teamLogo: logo,
      value: typeof value === "number" ? value : parseFloat(value) || 0,
      statLabel,
    }
  })
}

export async function GET() {
  try {
    const { id: competitionId, name: competitionName } = await resolveU22FCompetitionIdPublic()
    if (!competitionId) {
      throw new Error("No se encontró la competencia U22 Femenino. Definí GENIUS_U22F_COMPETITION_ID.")
    }

    const [sRaw, lRaw] = await Promise.all([
      getStandings(competitionId),
      getLeaders(competitionId).catch(() => null),
    ])

    const standings = normalizeStandings(sRaw).sort((a, b) => a.rank - b.rank)
    const scoringLeaders = extractLeaderCategory(lRaw, "points", "Puntos")
    const reboundsLeaders = extractLeaderCategory(lRaw, "rebounds", "Rebotes")
    const assistsLeaders = extractLeaderCategory(lRaw, "assists", "Asistencias")

    return NextResponse.json(
      {
        competition: { id: competitionId, name: competitionName ?? "U22 Femenino" },
        standings,
        scoringLeaders,
        reboundsLeaders,
        assistsLeaders,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (error: any) {
    return handleApiError(error, { context: "website/posiciones-u22f" })
  }
}
