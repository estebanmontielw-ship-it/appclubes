import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { cache } from "react"
import { Eye } from "lucide-react"
import prisma from "@/lib/prisma"
import { parseFocalPoint } from "@/lib/image"
import { getPageViews, isGa4Configured } from "@/lib/ga4"

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

  // Build absolute image URL — WhatsApp requires absolute HTTPS URLs and
  // caches aggressively, so we also append a cache-buster derived from the
  // article's updatedAt timestamp so edits invalidate the preview.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"
  const rawImage = noticia.imagenUrl ? parseFocalPoint(noticia.imagenUrl).src : ""
  const absoluteImage = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${baseUrl}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`
    : ""
  const ogImage = absoluteImage
    ? `${absoluteImage}${absoluteImage.includes("?") ? "&" : "?"}v=${noticia.updatedAt?.getTime() ?? ""}`
    : undefined

  const images = ogImage
    ? [{ url: ogImage, width: 1200, height: 630, alt: noticia.titulo, type: "image/jpeg" }]
    : []

  return {
    title: noticia.titulo,
    description: noticia.extracto,
    openGraph: {
      type: "article",
      title: noticia.titulo,
      description: noticia.extracto,
      url: `${baseUrl}/noticias/${params.slug}`,
      siteName: "Confederación Paraguaya de Básquetbol",
      locale: "es_PY",
      publishedTime: noticia.publicadaEn?.toISOString(),
      modifiedTime: noticia.updatedAt?.toISOString(),
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

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
}

function fmtViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default async function NoticiaDetailPage({ params }: { params: { slug: string } }) {
  const noticia = await getNoticia(params.slug)
  if (!noticia) notFound()

  const fecha = noticia.publicadaEn
    ? new Date(noticia.publicadaEn).toLocaleDateString("es-PY", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Asuncion",
      })
    : null

  const hora = noticia.publicadaEn
    ? new Date(noticia.publicadaEn).toLocaleTimeString("es-PY", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Asuncion",
      })
    : null

  let vistas: number | null = null
  if (isGa4Configured()) {
    try {
      vistas = await getPageViews(`/noticias/${params.slug}`, 90)
    } catch {
      // GA4 fail → ignore
    }
  }

  const galeria: string[] = noticia.galeria ? JSON.parse(noticia.galeria) : []
  const cover = parseFocalPoint(noticia.imagenUrl)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: noticia.titulo,
    description: noticia.extracto ?? undefined,
    url: `${baseUrl}/noticias/${noticia.slug}`,
    datePublished: noticia.publicadaEn?.toISOString(),
    dateModified: noticia.updatedAt?.toISOString(),
    image: cover.src ? [cover.src] : undefined,
    author: {
      "@type": "Organization",
      name: noticia.autorNombre ?? "CPB",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Confederación Paraguaya de Básquetbol",
      logo: { "@type": "ImageObject", url: `${baseUrl}/favicon-cpb.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}/noticias/${noticia.slug}` },
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/noticias" className="text-primary hover:underline">
          &larr; Volver a noticias
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {categoryLabels[noticia.categoria] ?? noticia.categoria}
          </span>
          {fecha && (
            <span className="text-sm text-gray-400">
              {fecha}
              {hora && <span className="text-gray-300"> · {hora}</span>}
            </span>
          )}
          {vistas != null && vistas > 0 && (
            <span className="inline-flex items-center gap-1 text-sm text-gray-400">
              <Eye className="h-3.5 w-3.5" />
              {fmtViews(vistas)} {vistas === 1 ? "vista" : "vistas"}
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          {noticia.titulo}
        </h1>
        <p className="mt-2 text-sm text-gray-500">Por {noticia.autorNombre || "CPB"}</p>
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
        className="prose-cpb max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(noticia.contenido) }}
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
