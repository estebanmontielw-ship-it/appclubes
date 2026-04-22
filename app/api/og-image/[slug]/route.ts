import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { parseFocalPoint } from "@/lib/image"
import sharp from "sharp"

// Dynamic image at exactly 1200x630 (WhatsApp/Facebook/Twitter "large
// preview" optimal). We crop the original cover using its focal point so
// the important part stays in frame.

const OG_WIDTH = 1200
const OG_HEIGHT = 630

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const noticia = await prisma.noticia.findUnique({
    where: { slug: params.slug, publicada: true },
    select: { imagenUrl: true },
  })

  if (!noticia?.imagenUrl) {
    return new Response("No cover image", { status: 404 })
  }

  const parsed = parseFocalPoint(noticia.imagenUrl)
  const srcUrl = parsed.src

  try {
    const res = await fetch(srcUrl, { cache: "force-cache" })
    if (!res.ok) {
      return new Response(`Source image ${res.status}`, { status: 502 })
    }
    const input = Buffer.from(await res.arrayBuffer())

    // Compute focal-aware crop. Sharp's resize(w,h,{fit:"cover"}) centers
    // the crop by default — we shift it toward the focal point.
    const meta = await sharp(input).metadata()
    const srcW = meta.width ?? OG_WIDTH
    const srcH = meta.height ?? OG_HEIGHT

    const targetRatio = OG_WIDTH / OG_HEIGHT
    const srcRatio = srcW / srcH

    let pipeline = sharp(input)

    if (Math.abs(srcRatio - targetRatio) < 0.01) {
      // Aspect ratio already matches — just resize
      pipeline = pipeline.resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" })
    } else if (srcRatio > targetRatio) {
      // Source is WIDER than target → crop horizontally
      const cropW = Math.round(srcH * targetRatio)
      const fx = parsed.focal ? parsed.focal.x / 100 : 0.5
      let left = Math.round(srcW * fx - cropW / 2)
      left = Math.max(0, Math.min(left, srcW - cropW))
      pipeline = pipeline
        .extract({ left, top: 0, width: cropW, height: srcH })
        .resize(OG_WIDTH, OG_HEIGHT)
    } else {
      // Source is TALLER than target → crop vertically
      const cropH = Math.round(srcW / targetRatio)
      const fy = parsed.focal ? parsed.focal.y / 100 : 0.5
      let top = Math.round(srcH * fy - cropH / 2)
      top = Math.max(0, Math.min(top, srcH - cropH))
      pipeline = pipeline
        .extract({ left: 0, top, width: srcW, height: cropH })
        .resize(OG_WIDTH, OG_HEIGHT)
    }

    const output = await pipeline
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()

    // Use a Blob so BodyInit typing accepts it cleanly across Next/Node/TS
    // versions (Buffer and Uint8Array produce type friction).
    return new Response(new Blob([output as unknown as BlobPart], { type: "image/jpeg" }), {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        "content-length": String(output.length),
        // 1h browser, 24h CDN, serve stale up to 7d while revalidating
        "cache-control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    })
  } catch (e) {
    return new Response(`Error: ${String(e)}`, { status: 500 })
  }
}
