import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import ProgramacionLNBClient from "@/components/website/ProgramacionLNBClient"
import { loadLnbSchedule } from "@/lib/programacion-lnb"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Calendario | CPB - Confederación Paraguaya de Básquetbol",
  description:
    "Calendario completo de partidos de la Liga Nacional de Básquetbol. Fixtures, fechas, horarios y resultados — CPB.",
  openGraph: {
    title: "Calendario de Partidos | CPB",
    description: "Calendario completo de partidos del básquetbol paraguayo.",
    url: "/calendario",
  },
  alternates: { canonical: "/calendario" },
}

export default async function CalendarioPage() {
  let data: Awaited<ReturnType<typeof loadLnbSchedule>> | null = null
  let error: string | null = null

  try {
    data = await loadLnbSchedule()
  } catch (e: any) {
    error = e?.message || "Error cargando el calendario"
  }

  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <SectionTitle
          title="Calendario"
          subtitle="Fixture y programación — LNB 2026"
        />
        <div className="mt-6">
          {error || !data ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
              <p className="font-semibold mb-1">No se pudo cargar el calendario</p>
              <p className="text-sm">{error ?? "Error desconocido"}</p>
            </div>
          ) : (
            <ProgramacionLNBClient
              competitionName={data.competition.name}
              teams={data.teams}
              matches={data.matches}
              updatedAt={data.updatedAt}
              showCompetitionSwitch={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
