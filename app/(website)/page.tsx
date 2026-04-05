import type { Metadata } from "next"
import Link from "next/link"
import HeroSection from "@/components/website/HeroSection"

export const metadata: Metadata = {
  title: "Inicio | CPB - Confederación Paraguaya de Básquetbol",
  description:
    "Sitio oficial de la Confederación Paraguaya de Básquetbol. Calendario, posiciones, estadísticas, noticias y toda la información del básquetbol paraguayo.",
  openGraph: {
    title: "CPB - Confederación Paraguaya de Básquetbol",
    description:
      "Sitio oficial de la Confederación Paraguaya de Básquetbol. Calendario, posiciones, estadísticas, noticias y toda la información del básquetbol paraguayo.",
    url: "/",
  },
}
import SectionTitle from "@/components/website/SectionTitle"
import NewsCard from "@/components/website/NewsCard"
import QuickLinks from "@/components/website/QuickLinks"
import prisma from "@/lib/prisma"
import GeniusSportsHomeWidget from "./GeniusSportsHomeWidget"
import CuratorFeed from "@/components/website/CuratorFeed"
import MatchTicker from "@/components/website/MatchTicker"

export default async function HomePage() {
  // Fetch latest published news
  let noticias: any[] = []
  try {
    noticias = await prisma.noticia.findMany({
      where: { publicada: true },
      orderBy: [{ destacada: "desc" }, { publicadaEn: "desc" }],
      take: 4,
    })
  } catch {
    // Table may not exist yet during development
  }

  return (
    <>
      <MatchTicker />
      <HeroSection />

      {/* Quick Stats / Links */}
      <QuickLinks />

      {/* Upcoming matches widget */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SectionTitle title="Próximos Partidos" subtitle="Calendario de competencias de la CPB" />
        <div className="mt-6">
          <GeniusSportsHomeWidget />
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/calendario"
            className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
          >
            Ver calendario completo &rarr;
          </Link>
        </div>
      </section>

      {/* Social Media Feed */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SectionTitle title="Seguinos en Redes" subtitle="Las últimas publicaciones de la CPB" />
          <div className="mt-6">
            <CuratorFeed />
          </div>
        </div>
      </section>

      {/* Latest News */}
      {noticias.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <SectionTitle title="Últimas Noticias" />
              <Link
                href="/noticias"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Ver todas &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {noticias.map((noticia) => (
                <NewsCard
                  key={noticia.id}
                  titulo={noticia.titulo}
                  slug={noticia.slug}
                  extracto={noticia.extracto}
                  imagenUrl={noticia.imagenUrl}
                  categoria={noticia.categoria}
                  publicadaEn={noticia.publicadaEn}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
