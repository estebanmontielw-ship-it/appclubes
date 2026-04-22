import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { parseFocalPoint } from "@/lib/image"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")
  if (!slug) {
    return NextResponse.json({ error: "Missing ?slug=..." }, { status: 400 })
  }

  const noticia = await prisma.noticia.findUnique({
    where: { slug },
    select: {
      id: true,
      titulo: true,
      slug: true,
      imagenUrl: true,
      publicada: true,
      publicadaEn: true,
      updatedAt: true,
      autorNombre: true,
    },
  })

  if (!noticia) {
    return NextResponse.json({ error: "Noticia not found", slug }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"
  const parsed = parseFocalPoint(noticia.imagenUrl)
  const rawImage = parsed.src
  const ogImage = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${baseUrl}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`
    : null

  // Try fetching og:image to see if it's reachable and what content-type it returns
  let imageReachable: { status: number; contentType: string | null; size: string | null } | null = null
  if (ogImage) {
    try {
      const res = await fetch(ogImage, { method: "HEAD" })
      imageReachable = {
        status: res.status,
        contentType: res.headers.get("content-type"),
        size: res.headers.get("content-length"),
      }
    } catch (e) {
      imageReachable = { status: 0, contentType: null, size: `error: ${String(e)}` }
    }
  }

  return NextResponse.json({
    slug,
    baseUrl,
    noticia: {
      titulo: noticia.titulo,
      publicada: noticia.publicada,
      autorNombre: noticia.autorNombre,
      rawImagenUrl: noticia.imagenUrl,
    },
    og: {
      "og:title": noticia.titulo,
      "og:url": `${baseUrl}/noticias/${slug}`,
      "og:image": ogImage,
      "og:image:width": ogImage ? 1200 : null,
      "og:image:height": ogImage ? 630 : null,
    },
    imageReachable,
  })
}
