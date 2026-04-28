import { NextRequest } from "next/server"
import sharp from "sharp"

// Normaliza el tamaño visual de los logos de los clubes. Cada equipo sube
// su escudo con diferente cantidad de padding transparente alrededor, lo
// que hace que algunos logos se vean más chicos que otros cuando los
// renderizamos en un marco del mismo tamaño. Este endpoint:
//   1. Fetchea la imagen original
//   2. Trimea los pixeles transparentes del borde (bounding box real)
//   3. Resizea al tamaño pedido manteniendo aspect ratio
//   4. Agrega un padding chico uniforme para todos los logos
//   5. Devuelve PNG con fondo transparente
//
// Cache: 1d browser / 7d CDN / 30d stale-while-revalidate — los logos de
// los clubes no cambian seguido.

// Cuando el source falla (logo viejo, CDN caído, URL rota) devolvemos un
// PNG transparente del tamaño pedido en lugar de un 4xx/5xx. Esto es
// crítico para los flyers generados con `next/og`: satori hace el fetch
// del <img> directamente, y si recibe un body que no es PNG/JPG válido
// (ej. un Response 502 con texto) revienta el render entero del flyer
// con un Internal Server Error. Devolviendo un PNG vacío el flyer
// renderiza el resto OK aunque le falte un escudo.
async function transparentPng(size: number): Promise<Buffer> {
  return await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer()
}

function pngResponse(buf: Buffer, cache: boolean): Response {
  return new Response(new Blob([buf as unknown as BlobPart], { type: "image/png" }), {
    status: 200,
    headers: {
      "content-type": "image/png",
      "content-length": String(buf.length),
      // En el camino de error usamos cache corto para que el logo se
      // recupere apenas el source vuelva; en éxito mantenemos el cache largo.
      "cache-control": cache
        ? "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000"
        : "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  })
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  const sizeParam = req.nextUrl.searchParams.get("size") ?? "150"
  const size = Math.max(24, Math.min(600, parseInt(sizeParam, 10) || 150))

  if (!url) return new Response("Missing ?url=", { status: 400 })

  try {
    const srcRes = await fetch(url, { cache: "force-cache" })
    if (!srcRes.ok) {
      return pngResponse(await transparentPng(size), false)
    }
    const input = Buffer.from(await srcRes.arrayBuffer())

    // 5% de padding interno — deja respirar al logo y evita que choque con
    // el borde de la tarjeta cuando está muy "pegado".
    const padding = Math.round(size * 0.05)
    const inner = size - padding * 2

    // Solo trimeamos si la imagen tiene alpha (PNG con fondo transparente).
    // En una JPG opaca el trim recortaría bordes sólidos del mismo color y
    // puede arruinar logos de fondo claro.
    const meta = await sharp(input).metadata()
    let pipeline = sharp(input)
    if (meta.hasAlpha) {
      pipeline = pipeline.trim({ threshold: 5 })
    }

    const normalized = await pipeline
      .resize(inner, inner, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer()

    return pngResponse(normalized, true)
  } catch {
    return pngResponse(await transparentPng(size), false)
  }
}
