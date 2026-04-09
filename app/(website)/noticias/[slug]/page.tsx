import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { cache } from "react"
import prisma from "@/lib/prisma"
import { parseFocalPoint } from "@/lib/image"

// Deduplicate DB call between generateMetadata and page component
const getNoticia = cache(async (slug: string) => {
  try {
    return await prisma.noticia.findUnique({
      where: { slug, publicada: true },
    })
  } catch {
    return null
  }
})

// Revalidate individual news every 1 hour
export const revalidate = 3600

const categoryLabels: Record<string, string> = {
  GENERAL: "General",
  TORNEOS: "Torneos",
  SELECCIONES: "Selecciones",
  ARBITRAJE: "Arbitraje",
  INSTITUCIONAL: "Institucional",
  CLUBES: "Clubes",
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const noticia = await getNoticia(params.slug)
  if (!noticia) return { title: "Noticia no encontrada" }

  // Clean image URL (strip focal point hash — not valid in og:image)
  const ogImage = noticia.imagenUrl
    ? parseFocalPoint(noticia.imagenUrl).src
    : undefined

  const images = ogImage
    ? [{ url: ogImage, width: 1200, height: 630, alt: noticia.titulo }]
    : []

  return {
    title: noticia.titulo,
    description: noticia.extracto,
    openGraph: {
      type: "article",
      title: noticia.titulo,
      description: noticia.extracto,
      url: `/noticias/${params.slug}`,
      publishedTime: noticia.publicadaEn?.toISOString(),
      ...(images.length > 0 && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title: noticia.titulo,
      description: noticia.extracto,
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

export default async function NoticiaDetailPage({ params }: { params: { slug: string } }) {
  const noticia = await getNoticia(params.slug)
  if (!noticia) notFound()

  const fecha = noticia.publicadaEn
    ? new Date(noticia.publicadaEn).toLocaleDateString("es-PY", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  const galeria: string[] = noticia.galeria ? JSON.parse(noticia.galeria) : []
  const cover = parseFocalPoint(noticia.imagenUrl)

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/noticias" className="text-primary hover:underline">
          &larr; Volver a noticias
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {categoryLabels[noticia.categoria] ?? noticia.categoria}
          </span>
          {fecha && <span className="text-sm text-gray-400">{fecha}</span>}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          {noticia.titulo}
        </h1>
        {noticia.autorNombre && (
          <p className="mt-2 text-sm text-gray-500">Por {noticia.autorNombre}</p>
        )}
      </header>

      {/* Cover image */}
      {cover.src && (
        <div className="mb-8 rounded-xl overflow-hidden bg-gray-100 aspect-video max-h-[500px]">
          <img
            src={cover.src}
            alt={noticia.titulo}
            className="w-full h-full object-cover"
            style={{ objectPosition: cover.objectPosition }}
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: noticia.contenido }}
      />

      {/* Video */}
      {noticia.videoUrl && (
        <div className="mt-8">
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
            <iframe
              src={noticia.videoUrl.replace("watch?v=", "embed/")}
              className="w-full h-full"
              allowFullScreen
              title="Video"
            />
          </div>
        </div>
      )}

      {/* Gallery */}
      {galeria.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Galería</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {galeria.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={url} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
