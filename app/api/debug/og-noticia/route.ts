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

  // HEAD fetch on the image — does it respond 200? what size/type?
  let imageReachable: { status: number; contentType: string | null; size: string | null } | null = null
  let imageDimensions: { width: number; height: number; format: string } | null = null
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

    // Probe actual image dimensions by reading the file header (first 32 bytes
    // is enough for PNG IHDR or JPEG SOFn markers within a few KB).
    try {
      const res = await fetch(ogImage, { headers: { range: "bytes=0-65535" } })
      const buf = Buffer.from(await res.arrayBuffer())
      // PNG: signature 89 50 4E 47, then IHDR at offset 16..23 (width 16-19, height 20-23)
      if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
        imageDimensions = { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), format: "png" }
      } else if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
        // JPEG: scan for SOFn marker (0xFFC0..0xFFCF except C4, C8, CC)
        let i = 2
        while (i < buf.length - 9) {
          if (buf[i] !== 0xff) { i++; continue }
          const marker = buf[i + 1]
          if (
            marker >= 0xc0 && marker <= 0xcf &&
            marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
          ) {
            imageDimensions = {
              height: buf.readUInt16BE(i + 5),
              width: buf.readUInt16BE(i + 7),
              format: "jpeg",
            }
            break
          }
          const segLen = buf.readUInt16BE(i + 2)
          i += 2 + segLen
        }
      }
    } catch {
      // ignore
    }
  }

  // Compute aspect ratio hints
  const aspectRatio = imageDimensions
    ? (imageDimensions.width / imageDimensions.height).toFixed(3)
    : null
  const whatsappOk = imageDimensions
    ? imageDimensions.width >= 300 && imageDimensions.height >= 200
    : null


  // Fetch the actual deployed news page and extract ALL og:/twitter: meta
  // tags so we can see what the server is really putting in the <head>.
  const pageUrl = `${baseUrl}/noticias/${slug}`
  let metaTags: string[] = []
  let fetchError: string | null = null
  try {
    const pageRes = await fetch(pageUrl, {
      headers: {
        // WhatsApp/Facebook-like user agent
        "user-agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      },
      cache: "no-store",
    })
    const html = await pageRes.text()
    // Grab <meta ...> lines containing og: or twitter:
    const matches = html.match(/<meta[^>]*(?:property|name)=["'](?:og:|twitter:)[^"']*["'][^>]*>/gi) ?? []
    metaTags = matches.map((m) => m.trim())
  } catch (e) {
    fetchError = String(e)
  }

  return NextResponse.json({
    slug,
    baseUrl,
    pageUrl,
    noticia: {
      titulo: noticia.titulo,
      publicada: noticia.publicada,
      autorNombre: noticia.autorNombre,
      rawImagenUrl: noticia.imagenUrl,
    },
    ogComputed: {
      "og:image": ogImage,
    },
    imageReachable,
    imageDimensions,
    aspectRatio,
    whatsappOk,
    metaTagsInPage: metaTags,
    fetchError,
  })
}
