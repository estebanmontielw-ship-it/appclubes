import type { Metadata } from "next"
import Link from "next/link"
import HeroSection from "@/components/website/HeroSection"
import SectionTitle from "@/components/website/SectionTitle"
import NewsCard from "@/components/website/NewsCard"
import QuickLinks from "@/components/website/QuickLinks"
import prisma from "@/lib/prisma"
import SocialCarousel from "@/components/website/SocialCarousel"
import LNBMatchCards from "@/components/website/LNBMatchCards"
import LNBMatchTicker from "@/components/website/LNBMatchTicker"
import { loadLnbSchedule } from "@/lib/programacion-lnb"

// Revalidate homepage every 5 minutes
export const revalidate = 300

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
  alternates: {
    canonical: "/",
  },
}

export default async function HomePage() {
  // Fetch latest published news
  let noticias: any[] = []
  try {
    noticias = await prisma.noticia.findMany({
      where: { publicada: true },
      orderBy: [{ destacada: "desc" }, { publicadaEn: "desc" }],
      take: 4,
      select: {
        id: true,
        titulo: true,
        slug: true,
        extracto: true,
        imagenUrl: true,
        categoria: true,
        publicadaEn: true,
      },
    })
  } catch {
    // Table may not exist yet during development
  }

  // Fetch hero rotating images
  let heroSlides: any[] = []
  try {
    heroSlides = await prisma.heroImage.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        imageUrl: true,
        focalDesktopX: true,
        focalDesktopY: true,
        focalMobileX: true,
        focalMobileY: true,
      },
    })
  } catch {
    // Table may not exist yet during development
  }

  // Load LNB schedule for ticker + home cards
  let tickerMatches: Awaited<ReturnType<typeof loadLnbSchedule>>["matches"] = []
  let homeMatches: Awaited<ReturnType<typeof loadLnbSchedule>>["matches"] = []
  let nextMatchId: string | number | null = null

  try {
    const { matches } = await loadLnbSchedule()

    const now = new Date().toISOString()

    const liveMatches = matches.filter(
      (m) => m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
    )
    const upcomingMatches = matches
      .filter((m) => m.status !== "COMPLETE" && !liveMatches.includes(m))
      .sort((a, b) => (a.isoDateTime ?? "").localeCompare(b.isoDateTime ?? ""))
    const recentComplete = matches
      .filter((m) => m.status === "COMPLETE")
      .slice(-4)

    // Ticker: recent results + live + next upcoming (up to 20 total)
    tickerMatches = [...recentComplete, ...liveMatches, ...upcomingMatches].slice(0, 20)

    // Home cards: live + next 8 upcoming
    homeMatches = [...liveMatches, ...upcomingMatches.slice(0, 8)]

    // Next match ID: first upcoming (by date) that is not complete
    const next = upcomingMatches.find((m) => m.isoDateTime && m.isoDateTime >= now)
    nextMatchId = next?.id ?? upcomingMatches[0]?.id ?? null
  } catch {
    // API unavailable — show empty state gracefully
  }

  return (
    <>
      <LNBMatchTicker matches={tickerMatches} />
      <HeroSection slides={heroSlides} />

      {/* Quick Stats / Links */}
      <QuickLinks />

      {/* Upcoming matches */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SectionTitle title="Próximos Partidos" subtitle="Calendario LNB 2026 — Liga Nacional de Básquetbol" />
        <div className="mt-6">
          <LNBMatchCards matches={homeMatches} nextMatchId={nextMatchId} />
        </div>
      </section>

      {/* Social Media Feed */}
      <section className="bg-gray-50 border-t border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SectionTitle title="Seguinos en Redes" subtitle="Las últimas publicaciones de la CPB" />
        </div>
        <div className="pb-12 min-h-[340px]">
          <SocialCarousel />
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
