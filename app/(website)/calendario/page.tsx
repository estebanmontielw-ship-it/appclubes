import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import GeniusSportsWidget from "@/components/website/GeniusSportsWidget"

export const metadata: Metadata = {
  title: "Calendario",
  description: "Calendario de partidos del básquetbol paraguayo - Confederación Paraguaya de Básquetbol",
  openGraph: {
    title: "Calendario de Partidos | CPB",
    description: "Calendario de partidos del básquetbol paraguayo - Confederación Paraguaya de Básquetbol",
    url: "/calendario",
  },
}

export default function CalendarioPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Calendario"
        subtitle="Fixture y programación de partidos"
      />
      <div className="mt-6">
        <GeniusSportsWidget
          page="/schedule"
          showNavBar={false}
          showCompetitionChooser={true}
          showMatchFilter={true}
          showSubMenus={true}
        />
      </div>
    </div>
  )
}
