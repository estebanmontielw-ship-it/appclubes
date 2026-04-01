import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import GeniusSportsWidget from "@/components/website/GeniusSportsWidget"

export const metadata: Metadata = {
  title: "Estadísticas",
  description: "Estadísticas de jugadores y equipos del básquetbol paraguayo - Confederación Paraguaya de Básquetbol",
}

export default function EstadisticasPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Estadísticas"
        subtitle="Estadísticas detalladas de jugadores y equipos"
      />
      <div className="mt-6">
        <GeniusSportsWidget
          page="/statistics"
          showNavBar={false}
          showCompetitionChooser={true}
          showMatchFilter={false}
        />
      </div>
    </div>
  )
}
