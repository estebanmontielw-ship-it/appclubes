import type { StandingRow } from "@/components/website/LNBStandings"

export function normalizeStandings(raw: any): StandingRow[] {
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
      winPct:
        (stats?.played ?? stats?.gamesPlayed ?? 0) > 0
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
