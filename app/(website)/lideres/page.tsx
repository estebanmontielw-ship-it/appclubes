import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import GeniusSportsWidget from "@/components/website/GeniusSportsWidget"

export const metadata: Metadata = {
  title: "Líderes",
  description: "Líderes estadísticos del básquetbol paraguayo - Confederación Paraguaya de Básquetbol",
  openGraph: {
    title: "Líderes Estadísticos | CPB",
    description: "Líderes estadísticos del básquetbol paraguayo - Confederación Paraguaya de Básquetbol",
    url: "/lideres",
  },
}

export default function LideresPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Líderes"
        subtitle="Los mejores jugadores en cada categoría estadística"
      />
      <div className="mt-6">
        <GeniusSportsWidget
          page="/leaders"
          showNavBar={false}
          showCompetitionChooser={true}
          showMatchFilter={false}
        />
      </div>
    </div>
  )
}
