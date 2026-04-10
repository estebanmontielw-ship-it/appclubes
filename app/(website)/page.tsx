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
}

export default async function HomePage() {
  // Temporary 3x3 tournament banner — visible Apr 10–13 2026 (disappears Mon 9am PY time = Apr 14 13:00 UTC)
  const showTorneo3x3 = new Date() < new Date("2026-04-14T13:00:00Z")
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

      {/* Torneo 3x3 temporary banner */}
      {showTorneo3x3 && (
        <section className="bg-[#0f2044]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-blue-300 uppercase tracking-widest mb-0.5">
                Hoy · Paseo La Galería
              </p>
              <p className="text-white font-black text-lg sm:text-xl leading-tight">
                Torneo 3x3 CPB 2026
              </p>
              <p className="text-blue-200 text-sm mt-0.5">
                Fixture, grupos y resultados en tiempo real
              </p>
            </div>
            <a
              href="https://play.fiba3x3.com/events/1df65c77-d14f-4592-a03d-609fdc9a5a93/schedule"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#0f2044] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
            >
              Más información →
            </a>
          </div>
        </section>
      )}

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
        <div className="pb-12">
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
