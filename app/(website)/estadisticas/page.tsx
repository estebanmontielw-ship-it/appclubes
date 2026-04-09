import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import { BarChart2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Estadísticas | CPB - Confederación Paraguaya de Básquetbol",
  description:
    "Estadísticas detalladas de jugadores y equipos de la Liga Nacional de Básquetbol — CPB.",
  openGraph: {
    title: "Estadísticas | CPB",
    description: "Estadísticas detalladas de jugadores y equipos del básquetbol paraguayo.",
    url: "/estadisticas",
  },
}

export default function EstadisticasPage() {
  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <SectionTitle
          title="Estadísticas"
          subtitle="Estadísticas detalladas de jugadores y equipos"
        />
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold text-base">
            Estadísticas disponibles cuando haya partidos jugados.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Las estadísticas detalladas por jugador y equipo se publicarán a partir de la primera fecha.
          </p>
        </div>
      </div>
    </div>
  )
}
