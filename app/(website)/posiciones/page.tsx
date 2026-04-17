import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import PosicionesClient from "@/components/website/PosicionesClient"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getStandings } from "@/lib/genius-sports"
import { normalizeStandings } from "@/lib/normalize-standings"
import type { StandingRow } from "@/components/website/LNBStandings"

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
