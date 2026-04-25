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
import { loadLnbSchedule, loadLnbfSchedule, type NormalizedMatch } from "@/lib/programacion-lnb"

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

  function processSchedule(matches: NormalizedMatch[]) {
    const nowIso = new Date().toISOString()
    const live = matches.filter(
      (m) => m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
    )
    const upcoming = matches
      .filter((m) => m.status !== "COMPLETE" && !live.includes(m))
      .sort((a, b) => (a.isoDateTime ?? "").localeCompare(b.isoDateTime ?? ""))
    const recent = matches.filter((m) => m.status === "COMPLETE").slice(-4)
    const next = upcoming.find((m) => m.isoDateTime && m.isoDateTime >= nowIso)
    return {
      ticker: [...recent, ...live, ...upcoming].slice(0, 20),
      home: [...live, ...upcoming.slice(0, 8)],
      nextId: next?.id ?? upcoming[0]?.id ?? null,
      live,
      upcoming,
    }
  }

  /** True if any match is live or kicks off within the next 2 hours. */
  function hasUrgentMatch(live: NormalizedMatch[], upcoming: NormalizedMatch[]): boolean {
    if (live.length > 0) return true
    const now = Date.now()
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000
    return upcoming.some((m) => {
      if (!m.isoDateTime) return false
      const delta = new Date(m.isoDateTime).getTime() - now
      return delta >= 0 && delta <= TWO_HOURS_MS
    })
  }

  let tickerMatches: NormalizedMatch[] = []
  let homeMatches: NormalizedMatch[] = []
  let nextMatchId: string | number | null = null
  let lnbfTickerMatches: NormalizedMatch[] = []
  let lnbfHomeMatches: NormalizedMatch[] = []
  let lnbfNextMatchId: string | number | null = null
  let initialLeague: "lnb" | "lnbf" = "lnb"

  try {
    const [lnb, lnbfResult] = await Promise.all([
      loadLnbSchedule(),
      loadLnbfSchedule().catch(() => null),
    ])

    const lnbProc = processSchedule(lnb.matches)
    tickerMatches = lnbProc.ticker
    homeMatches = lnbProc.home
    nextMatchId = lnbProc.nextId

    if (lnbfResult) {
      const lnbfProc = processSchedule(lnbfResult.matches)
      lnbfTickerMatches = lnbfProc.ticker
      lnbfHomeMatches = lnbfProc.home
      lnbfNextMatchId = lnbfProc.nextId

      const lnbUrgent = hasUrgentMatch(lnbProc.live, lnbProc.upcoming)
      const lnbfUrgent = hasUrgentMatch(lnbfProc.live, lnbfProc.upcoming)
      // LNBF first only when LNBF has urgency and LNB does not (LNB wins ties).
      if (lnbfUrgent && !lnbUrgent) initialLeague = "lnbf"
    }
  } catch {
    // API unavailable — show empty state gracefully
  }

  return (
    <>
      <LNBMatchTicker
        matches={tickerMatches}
        lnbfMatches={lnbfTickerMatches}
        initialLeague={initialLeague}
      />
      <HeroSection slides={heroSlides} />

      {/* Quick Stats / Links */}
      <QuickLinks />

      {/* Upcoming matches */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SectionTitle title="Próximos Partidos" subtitle="Calendario LNB 2026 — Liga Nacional de Básquetbol" />
        <div className="mt-6">
          <LNBMatchCards
            matches={homeMatches}
            nextMatchId={nextMatchId}
            lnbfMatches={lnbfHomeMatches}
            lnbfNextMatchId={lnbfNextMatchId}
            initialLeague={initialLeague}
          />
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
