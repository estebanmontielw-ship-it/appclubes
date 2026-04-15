import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import PosicionesClient from "@/components/website/PosicionesClient"
import { type StandingRow, type LeaderEntry } from "@/components/website/LNBStandings"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getStandings, getLeaders } from "@/lib/genius-sports"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Posiciones | CPB - Confederación Paraguaya de Básquetbol",
  description:
    "Tabla de posiciones y líderes estadísticos de la Liga Nacional de Básquetbol — CPB.",
  openGraph: {
    title: "Tabla de Posiciones | CPB",
    description: "Tabla de posiciones del básquetbol paraguayo.",
    url: "/posiciones",
  },
}

// Normalize raw standings response (handles both `response.data[]` and `data[]` shapes)
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
      winPct: stats?.winPercentage ?? stats?.winPct ?? stats?.pct ?? stats?.percentage ?? null,
      pointsFor: stats?.pointsFor ?? stats?.ptsFor ?? stats?.pf ?? stats?.totalPointsFor ?? stats?.totalPoints ?? null,
      pointsAgainst: stats?.pointsAgainst ?? stats?.ptsAgainst ?? stats?.pa ?? stats?.totalPointsAgainst ?? null,
      pointDiff:
        stats?.pointDifferential ??
        stats?.pointDiff ??
        stats?.pointsDifferential ??
        stats?.pDiff ??
        ((stats?.pointsFor ?? stats?.ptsFor ?? stats?.pf ?? stats?.totalPointsFor) != null &&
         (stats?.pointsAgainst ?? stats?.ptsAgainst ?? stats?.pa ?? stats?.totalPointsAgainst) != null
          ? (stats?.pointsFor ?? stats?.ptsFor ?? stats?.pf ?? stats?.totalPointsFor) -
            (stats?.pointsAgainst ?? stats?.ptsAgainst ?? stats?.pa ?? stats?.totalPointsAgainst)
          : null),
    }
  })
}

// Normalize a single stat category from leaders response
function extractLeaderCategory(raw: any, statKey: string, statLabel: string): LeaderEntry[] {
  const section = raw?.response?.data ?? raw?.data ?? (Array.isArray(raw) ? raw : [])

  // Genius leaders endpoint may return an array of {statName, leaders:[]} or flat arrays
  let entries: any[] = []
  if (Array.isArray(section)) {
    // Try to find the right category
    const found = section.find(
      (s: any) =>
        String(s.statName ?? s.stat ?? s.category ?? "").toLowerCase().includes(statKey.toLowerCase())
    )
    entries = found?.leaders ?? found?.players ?? found?.data ?? []
    // If not found by category, try using full array as the stat list
    if (!entries.length && section.length > 0 && section[0]?.player) {
      entries = section
    }
  }

  return entries.slice(0, 5).map((e: any, idx: number): LeaderEntry => {
    const player = e.player ?? e.competitor ?? e
    const team = e.team ?? e.competitor?.team ?? {}
    const logo =
      team?.images?.logo?.T1?.url ??
      team?.images?.logo?.S1?.url ??
      team?.logoUrl ??
      null

    const value =
      e[statKey] ??
      e.average ??
      e.value ??
      e.stat ??
      0

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

function normalizeLeaders(raw: any | null): {
  scoring: LeaderEntry[]
  rebounds: LeaderEntry[]
  assists: LeaderEntry[]
} {
  if (!raw) return { scoring: [], rebounds: [], assists: [] }
  return {
    scoring: extractLeaderCategory(raw, "points", "Puntos"),
    rebounds: extractLeaderCategory(raw, "rebounds", "Rebotes"),
    assists: extractLeaderCategory(raw, "assists", "Asistencias"),
  }
}

export default async function PosicionesPage() {
  const { id: competitionId } = await resolveLnbCompetitionIdPublic()

  let standings: StandingRow[] = []
  let scoringLeaders: LeaderEntry[] = []
  let reboundsLeaders: LeaderEntry[] = []
  let assistsLeaders: LeaderEntry[] = []
  let error: string | null = null

  try {
    if (!competitionId) throw new Error("No se encontró la competencia LNB activa.")

    const [sRaw, lRaw] = await Promise.all([
      getStandings(competitionId),
      getLeaders(competitionId).catch(() => null),
    ])

    standings = normalizeStandings(sRaw).sort((a, b) => a.rank - b.rank)
    const leaders = normalizeLeaders(lRaw)
    scoringLeaders = leaders.scoring
    reboundsLeaders = leaders.rebounds
    assistsLeaders = leaders.assists
  } catch (e: any) {
    error = e?.message ?? "Error desconocido"
  }

  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <SectionTitle
          title="Tabla de Posiciones"
          subtitle="Clasificación de equipos — LNB 2026"
        />
        <div className="mt-6">
          <PosicionesClient
            standings={standings}
            scoringLeaders={scoringLeaders}
            reboundsLeaders={reboundsLeaders}
            assistsLeaders={assistsLeaders}
            error={error}
            showCompetitionSwitch={true}
          />
        </div>
      </div>
    </div>
  )
}
