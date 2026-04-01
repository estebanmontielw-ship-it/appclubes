import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import GeniusSportsWidget from "@/components/website/GeniusSportsWidget"

export const metadata: Metadata = {
  title: "Posiciones",
  description: "Tabla de posiciones del básquetbol paraguayo - Confederación Paraguaya de Básquetbol",
}

export default function PosicionesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Tabla de Posiciones"
        subtitle="Clasificación de los equipos por competencia"
      />
      <div className="mt-6">
        <GeniusSportsWidget
          page="/standings"
          showNavBar={false}
          showCompetitionChooser={true}
          showMatchFilter={false}
        />
      </div>
    </div>
  )
}
