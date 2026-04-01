import Link from "next/link"
import HeroSection from "@/components/website/HeroSection"
import SectionTitle from "@/components/website/SectionTitle"
import NewsCard from "@/components/website/NewsCard"
import prisma from "@/lib/prisma"
import GeniusSportsHomeWidget from "./GeniusSportsHomeWidget"

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
      <HeroSection />

      {/* Quick Stats / Links */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Calendario", href: "/calendario", icon: "📅", desc: "Próximos partidos" },
              { label: "Posiciones", href: "/posiciones", icon: "🏆", desc: "Tabla de posiciones" },
              { label: "Estadísticas", href: "/estadisticas", icon: "📊", desc: "Stats de jugadores" },
              { label: "Clubes", href: "/clubes", icon: "🏀", desc: "Clubes afiliados" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
