import type { MetadataRoute } from "next"
import prisma from "@/lib/prisma"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/noticias`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/calendario`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/posiciones`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/estadisticas`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/institucional`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/clubes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/selecciones`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/reglamentos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contacto`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  ]

  // Dynamic news routes
  let newsRoutes: MetadataRoute.Sitemap = []
  try {
    const noticias = await prisma.noticia.findMany({
      where: { publicada: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publicadaEn: "desc" },
      take: 500,
    })

    newsRoutes = noticias.map((n) => ({
      url: `${BASE_URL}/noticias/${n.slug}`,
      lastModified: n.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  } catch {
    // Table may not exist yet
  }

  return [...staticRoutes, ...newsRoutes]
}
