import Link from "next/link"

interface NewsCardProps {
  titulo: string
  slug: string
  extracto: string
  imagenUrl?: string | null
  categoria: string
  publicadaEn: Date | string | null
}

const categoryLabels: Record<string, string> = {
  GENERAL: "General",
  TORNEOS: "Torneos",
  SELECCIONES: "Selecciones",
  ARBITRAJE: "Arbitraje",
  INSTITUCIONAL: "Institucional",
  CLUBES: "Clubes",
}

export default function NewsCard({ titulo, slug, extracto, imagenUrl, categoria, publicadaEn }: NewsCardProps) {
  const fecha = publicadaEn
    ? new Date(publicadaEn).toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric" })
    : null

  return (
    <Link href={`/noticias/${slug}`} className="group block">
      <article className="card-soft overflow-hidden h-full">
        {imagenUrl && (
          <div className="aspect-video overflow-hidden bg-gray-100">
            <img
              src={imagenUrl}
              alt={titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {categoryLabels[categoria] ?? categoria}
            </span>
            {fecha && <span className="text-xs text-gray-400">{fecha}</span>}
          </div>
          <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {titulo}
          </h3>
          <p className="mt-2 text-sm text-gray-500 line-clamp-3 leading-relaxed">{extracto}</p>
        </div>
      </article>
    </Link>
  )
}
