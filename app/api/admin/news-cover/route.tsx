import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const W = 1200
const H = 628

const CATEGORY_COLORS: Record<string, string> = {
  TORNEOS:     "#f97316",
  SELECCIONES: "#3b82f6",
  INSTITUCIONAL: "#8b5cf6",
  CLUBES:      "#10b981",
  ARBITRAJE:   "#ef4444",
  GENERAL:     "#6b7280",
}

const CATEGORY_LABELS: Record<string, string> = {
  TORNEOS:      "TORNEOS",
  SELECCIONES:  "SELECCIONES",
  INSTITUCIONAL: "INSTITUCIONAL",
  CLUBES:       "CLUBES",
  ARBITRAJE:    "ARBITRAJE",
  GENERAL:      "GENERAL",
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const titulo   = searchParams.get("titulo") ?? ""
  const categoria = (searchParams.get("categoria") ?? "GENERAL").toUpperCase()
  const home     = searchParams.get("home") ?? ""
  const away     = searchParams.get("away") ?? ""
  const homeScore = searchParams.get("homeScore") ?? ""
  const awayScore = searchParams.get("awayScore") ?? ""
  const fecha    = searchParams.get("fecha") ?? ""
  const bgUrl    = searchParams.get("bgUrl") ?? ""

  const hasMatch   = !!(home && away)
  const hasResult  = !!(homeScore && awayScore)
  const catColor   = CATEGORY_COLORS[categoria] ?? "#6b7280"
  const catLabel   = CATEGORY_LABELS[categoria] ?? categoria

  // Clamp titulo lines — satori doesn't word-wrap automatically
  const shortTitle = titulo.length > 90 ? titulo.slice(0, 87) + "…" : titulo

  return new ImageResponse(
    (
      <div style={{
        width: W, height: H,
        display: "flex",
        flexDirection: "column",
        background: "#0b1e3d",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background photo or gradient */}
        {bgUrl ? (
          <img src={bgUrl} width={W} height={H}
            style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover", display: "flex", opacity: 0.35 }}
            alt="" />
        ) : null}

        {/* Gradient overlay — always */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: W, height: H,
          background: bgUrl
            ? "linear-gradient(135deg, rgba(11,30,61,0.92) 0%, rgba(11,30,61,0.70) 50%, rgba(11,30,61,0.85) 100%)"
            : "linear-gradient(135deg, #0b1e3d 0%, #0d2a5e 40%, #091425 100%)",
          display: "flex",
        }} />

        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -120, right: -120, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${catColor}22 0%, transparent 65%)`, display: "flex" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,80,160,0.30) 0%, transparent 65%)", display: "flex" }} />

        {/* Orange accent bar top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${catColor} 0%, ${catColor}88 100%)`, display: "flex" }} />

        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 48, paddingRight: 48, paddingTop: 32, zIndex: 1 }}>
          {/* CPB logo + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="https://www.cpb.com.py/logo-cpb.jpg"
              width={44} height={44}
              style={{ borderRadius: 22, objectFit: "cover", display: "flex", border: "2px solid rgba(255,255,255,0.2)" }}
              alt="CPB"
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "white", fontSize: 13, fontWeight: 700, letterSpacing: 1, lineHeight: 1.2 }}>CPB</span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: 1, lineHeight: 1.2 }}>cpb.com.py</span>
            </div>
          </div>

          {/* Category badge */}
          <div style={{
            display: "flex", alignItems: "center",
            background: catColor,
            borderRadius: 20, paddingLeft: 14, paddingRight: 14, paddingTop: 6, paddingBottom: 6,
          }}>
            <span style={{ color: "white", fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>{catLabel}</span>
          </div>
        </div>

        {/* Main content area */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", paddingLeft: 48, paddingRight: 48, zIndex: 1 }}>
          {hasMatch ? (
            /* Match layout: teams on sides, title below */
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 20 }}>
              {/* Teams row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, width: "100%" }}>
                {/* Home */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <span style={{ color: "white", fontSize: hasResult ? 64 : 38, fontWeight: 900, lineHeight: 1 }}>
                    {hasResult ? homeScore : home.split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 3).toUpperCase()}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, fontWeight: 600, marginTop: 8, textAlign: "center" }}>
                    {home}
                  </span>
                </div>

                {/* Center */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 100 }}>
                  <span style={{ color: hasResult ? "rgba(255,255,255,0.3)" : catColor, fontSize: hasResult ? 36 : 28, fontWeight: 900 }}>
                    {hasResult ? "–" : "VS"}
                  </span>
                  {fecha ? <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4, textAlign: "center" }}>{fecha}</span> : null}
                </div>

                {/* Away */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <span style={{ color: "white", fontSize: hasResult ? 64 : 38, fontWeight: 900, lineHeight: 1 }}>
                    {hasResult ? awayScore : away.split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 3).toUpperCase()}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, fontWeight: 600, marginTop: 8, textAlign: "center" }}>
                    {away}
                  </span>
                </div>
              </div>

              {/* Title */}
              {shortTitle && (
                <span style={{
                  color: "white", fontSize: shortTitle.length > 60 ? 24 : 30,
                  fontWeight: 800, textAlign: "center", lineHeight: 1.3,
                  paddingLeft: 20, paddingRight: 20,
                }}>
                  {shortTitle}
                </span>
              )}
            </div>
          ) : (
            /* Text-only layout */
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 16 }}>
              <div style={{
                width: 48, height: 4, borderRadius: 2,
                background: catColor, display: "flex",
              }} />
              <span style={{
                color: "white",
                fontSize: shortTitle.length > 70 ? 36 : shortTitle.length > 50 ? 42 : 50,
                fontWeight: 900,
                lineHeight: 1.2,
                maxWidth: 900,
              }}>
                {shortTitle}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingLeft: 48, paddingRight: 48, paddingBottom: 28, zIndex: 1,
        }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, letterSpacing: 1 }}>
            CONFEDERACIÓN PARAGUAYA DE BÁSQUETBOL
          </span>
          <span style={{ color: catColor, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
            cpb.com.py
          </span>
        </div>
      </div>
    ),
    { width: W, height: H }
  )
}
