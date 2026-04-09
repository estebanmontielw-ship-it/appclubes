import { ImageResponse } from "next/og"
import prisma from "@/lib/prisma"
import { parseFocalPoint } from "@/lib/image"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = 3600

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "General",
  TORNEOS: "Torneos",
  SELECCIONES: "Selecciones",
  ARBITRAJE: "Arbitraje",
  INSTITUCIONAL: "Institucional",
  CLUBES: "Clubes",
}

export default async function OgImage({ params }: { params: { slug: string } }) {
  let titulo = "Noticias CPB"
  let categoria: string | null = null
  let imageUrl = ""

  try {
    const noticia = await prisma.noticia.findUnique({
      where: { slug: params.slug, publicada: true },
      select: { titulo: true, imagenUrl: true, categoria: true },
    })
    if (noticia) {
      titulo = noticia.titulo
      categoria = noticia.categoria
        ? (CATEGORY_LABELS[noticia.categoria] ?? noticia.categoria)
        : null
      const fp = parseFocalPoint(noticia.imagenUrl)
      imageUrl = fp.src
    }
  } catch {
    // Fallback to CPB branding if DB is unavailable
  }

  const hasImage = Boolean(imageUrl)
  // Dynamic font size: shrink if title is long
  const fontSize = titulo.length > 70 ? 40 : titulo.length > 50 ? 48 : 56
  const displayTitle = titulo.length > 90 ? titulo.slice(0, 87) + "…" : titulo

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a1628",
          position: "relative",
        }}
      >
        {/* Full-bleed article photo */}
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Gradient overlay: light top → dark bottom */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: hasImage
              ? "linear-gradient(to bottom, rgba(10,22,40,0.25) 0%, rgba(10,22,40,0.55) 45%, rgba(10,22,40,0.97) 100%)"
              : "#0a1628",
            display: "flex",
          }}
        />

        {/* Blue accent top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 7,
            background: "#2563eb",
            display: "flex",
          }}
        />

        {/* CPB logo + site — top left */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 44,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cpb.com.py/favicon-cpb.png"
            alt="CPB"
            width={38}
            height={38}
            style={{ borderRadius: 8 }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.80)",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            cpb.com.py
          </span>
        </div>

        {/* Bottom content block */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "0 48px 44px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Category pill */}
          {categoria && (
            <div style={{ display: "flex" }}>
              <div
                style={{
                  background: "#2563eb",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  padding: "5px 16px",
                  borderRadius: 999,
                }}
              >
                {categoria}
              </div>
            </div>
          )}

          {/* Article title */}
          <div
            style={{
              color: "white",
              fontSize,
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: -0.5,
            }}
          >
            {displayTitle}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
