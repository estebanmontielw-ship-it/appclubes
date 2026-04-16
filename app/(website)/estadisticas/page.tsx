import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import EstadisticasClient from "@/components/website/EstadisticasClient"

export const metadata: Metadata = {
  title: "Estadísticas | CPB - Confederación Paraguaya de Básquetbol",
  description:
    "Estadísticas detalladas de todos los jugadores y equipos de la LNB 2026 — promedios, totales, % de tiro y más.",
  openGraph: {
    title: "Estadísticas | CPB",
    description: "Estadísticas completas de jugadores y equipos del básquetbol paraguayo.",
    url: "/estadisticas",
  },
}

export default function EstadisticasPage() {
  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <SectionTitle
          title="Estadísticas"
          subtitle="Estadísticas detalladas de jugadores y equipos — LNB 2026"
        />
        <div className="mt-6">
          <EstadisticasClient />
        </div>
      </div>
    </div>
  )
}
