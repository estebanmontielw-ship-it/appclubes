import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import PosicionesClient from "@/components/website/PosicionesClient"
import { type StandingRow } from "@/components/website/LNBStandings"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getStandings } from "@/lib/genius-sports"

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


export default async function PosicionesPage() {
  const { id: competitionId } = await resolveLnbCompetitionIdPublic()

  let standings: StandingRow[] = []
  let error: string | null = null

  try {
    if (!competitionId) throw new Error("No se encontró la competencia LNB activa.")
    const sRaw = await getStandings(competitionId)
    standings = normalizeStandings(sRaw).sort((a, b) => a.rank - b.rank)
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
            error={error}
            showCompetitionSwitch={true}
          />
        </div>
      </div>
    </div>
  )
}
