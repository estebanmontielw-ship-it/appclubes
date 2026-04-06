import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import PartidosClient from "./PartidosClient"

export const metadata: Metadata = {
  title: "Partidos | CPB",
  description: "Resultados y fixture del básquetbol paraguayo — Confederación Paraguaya de Básquetbol",
  openGraph: {
    title: "Partidos | CPB",
    description: "Resultados y fixture del básquetbol paraguayo",
    url: "/partidos",
  },
}

export default function PartidosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Partidos"
        subtitle="Resultados y fixture de las competencias CPB"
      />
      <div className="mt-6">
        <PartidosClient />
      </div>
    </div>
  )
}
