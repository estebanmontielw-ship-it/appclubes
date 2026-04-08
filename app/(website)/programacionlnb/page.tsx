import type { Metadata } from "next"
import ProgramacionLNBClient from "@/components/website/ProgramacionLNBClient"
import { loadLnbSchedule } from "@/lib/programacion-lnb"

// ISR: refresh every 5 minutes. The Genius Sports schedule is also cached
// inside the lib helper, so this is mainly a safety cap.
export const revalidate = 300

export const metadata: Metadata = {
  title: "Programación LNB",
  description:
    "Programación confirmada de la Liga Nacional de Básquetbol. Filtrá por fecha, club o condición (local/visitante).",
  robots: {
    // Accessible by direct link, but not indexed/crawled
    index: false,
    follow: false,
  },
}

export default async function ProgramacionLNBPage() {
  let data: Awaited<ReturnType<typeof loadLnbSchedule>> | null = null
  let error: string | null = null

  try {
    data = await loadLnbSchedule()
  } catch (e: any) {
    error = e?.message || "Error cargando la programación"
  }

  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {error || !data ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            <p className="font-semibold mb-1">No se pudo cargar la programación</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-3 text-red-600/80">
              Revisá que la API de Genius Sports esté respondiendo y que la competencia LNB
              esté activa. También podés definir GENIUS_LNB_COMPETITION_ID en las variables
              de entorno para forzar una competencia específica.
            </p>
          </div>
        ) : (
          <ProgramacionLNBClient
            competitionName={data.competition.name}
            teams={data.teams}
            matches={data.matches}
            updatedAt={data.updatedAt}
          />
        )}
      </div>
    </div>
  )
}
