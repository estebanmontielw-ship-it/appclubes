import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import NewsCard from "@/components/website/NewsCard"
import prisma from "@/lib/prisma"
import Link from "next/link"

// Revalidate news list every 5 minutes
export const revalidate = 300

export const metadata: Metadata = {
  title: "Noticias",
  description: "Últimas noticias del básquetbol paraguayo - Confederación Paraguaya de Básquetbol",
  openGraph: {
    title: "Noticias | CPB",
    description: "Últimas noticias del básquetbol paraguayo - Confederación Paraguaya de Básquetbol",
    url: "/noticias",
  },
  alternates: {
    canonical: "/noticias",
  },
}

const ITEMS_PER_PAGE = 12

const categoryLabels: Record<string, string> = {
  GENERAL: "General",
  TORNEOS: "Torneos",
  SELECCIONES: "Selecciones",
  ARBITRAJE: "Arbitraje",
  INSTITUCIONAL: "Institucional",
  CLUBES: "Clubes",
}

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams: { pagina?: string; categoria?: string }
}) {
  const page = Math.max(1, parseInt(searchParams.pagina ?? "1"))
  const categoria = searchParams.categoria

  let noticias: any[] = []
  let total = 0

  try {
    const where: any = { publicada: true }
    if (categoria) where.categoria = categoria

    ;[noticias, total] = await Promise.all([
      prisma.noticia.findMany({
        where,
        orderBy: [{ destacada: "desc" }, { publicadaEn: "desc" }],
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        select: {
          id: true,
          titulo: true,
          slug: true,
          extracto: true,
          imagenUrl: true,
          categoria: true,
          publicadaEn: true,
        },
      }),
      prisma.noticia.count({ where }),
    ])
  } catch {
    // Table may not exist yet
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Noticias"
        subtitle="Últimas novedades del básquetbol paraguayo"
      />

      {/* Category filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/noticias"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !categoria ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todas
        </Link>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Link
            key={key}
            href={`/noticias?categoria=${key}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categoria === key ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* News grid */}
      {noticias.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      ) : (
        <div className="mt-12 text-center py-12">
          <p className="text-gray-400 text-lg">No hay noticias disponibles</p>
          <p className="text-gray-400 text-sm mt-1">Las noticias aparecerán aquí cuando se publiquen</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/noticias?pagina=${p}${categoria ? `&categoria=${categoria}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === page ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
