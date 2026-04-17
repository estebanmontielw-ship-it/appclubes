import { ImageResponse } from "next/og"
import prisma from "@/lib/prisma"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const LNB_LEAGUES: Record<string, string[]> = {
  "olimpia":                    ["LNB Masculino", "LNB Femenino"],
  "colonias-gold":              ["LNB Masculino"],
  "deportivo-san-jose":         ["LNB Masculino", "LNB Femenino"],
  "felix-perez-cardozo":        ["LNB Masculino", "LNB Femenino"],
  "club-deportivo-amambay":     ["LNB Masculino"],
  "club-deportivo-campo-alto":  ["LNB Masculino"],
  "club-san-alfonzo":           ["LNB Masculino"],
  "club-atletico-ciudad-nueva": ["LNB Masculino"],
  "sol-de-america":             ["LNB Femenino"],
  "sportivo-sanlorenzo":        ["U22 Femenino"],
}

export default async function OgImage({ params }: { params: { slug: string } }) {
  let club: { nombre: string; ciudad: string; logoUrl: string | null; sigla: string | null } | null = null
  try {
    club = await prisma.club.findUnique({
      where: { slug: params.slug, activo: true },
      select: { nombre: true, ciudad: true, logoUrl: true, sigla: true },
    })
  } catch { /* DB unavailable — use fallback */ }

  const nombre = club?.nombre ?? "Club"
  const ciudad = club?.ciudad ?? ""
  const leagues = LNB_LEAGUES[params.slug] ?? []
  const isLnbMasc = leagues.includes("LNB Masculino")
  const accentGradient = isLnbMasc
    ? "linear-gradient(90deg, #1d4ed8, #2563eb, #3b82f6)"
    : "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)"

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://cpb.com.py"
  const logoSrc = club?.logoUrl
    ? club.logoUrl.startsWith("http") ? club.logoUrl : `${baseUrl}${club.logoUrl}`
    : null

  const initials = nombre.split(" ")
    .filter((w) => w.length > 2)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const fontSize = nombre.length > 24 ? 52 : nombre.length > 16 ? 64 : 80

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a1628",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: accentGradient, display: "flex" }} />

        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 380, height: 380, borderRadius: "50%", background: "rgba(59,130,246,0.06)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(59,130,246,0.04)", display: "flex" }} />

        {/* Club logo */}
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            width={170}
            height={170}
            style={{ marginBottom: 32, borderRadius: 24, objectFit: "contain" }}
            alt={nombre}
          />
        ) : (
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: 24,
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 56, fontWeight: 900 }}>{initials}</span>
          </div>
        )}

        {/* Club name */}
        <div style={{ display: "flex", marginBottom: 16, textAlign: "center" }}>
          <span
            style={{
              color: "white",
              fontSize,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 4,
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            {nombre}
          </span>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 50, height: 2, background: "#1e3a5f", borderRadius: 2, display: "flex" }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isLnbMasc ? "#3b82f6" : "#f59e0b", display: "flex" }} />
          <div style={{ width: 50, height: 2, background: "#1e3a5f", borderRadius: 2, display: "flex" }} />
        </div>

        {/* City + leagues */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {ciudad && (
            <span style={{ color: "#64748b", fontSize: 26, fontWeight: 500, letterSpacing: 1 }}>{ciudad}</span>
          )}
          {ciudad && leagues.length > 0 && (
            <span style={{ color: "#334155", fontSize: 22, display: "flex" }}>·</span>
          )}
          {isLnbMasc && (
            <span style={{ color: "#93c5fd", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>LNB 2026</span>
          )}
          {!isLnbMasc && leagues.length > 0 && (
            <span style={{ color: "#fbbf24", fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>{leagues[0]}</span>
          )}
        </div>

        {/* CPB branding bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 52,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cpb.com.py/favicon-cpb.png"
            width={26}
            height={26}
            style={{ borderRadius: 6, opacity: 0.5 }}
            alt="CPB"
          />
          <span style={{ color: "#334155", fontSize: 16, fontWeight: 500, letterSpacing: 1, display: "flex" }}>
            cpb.com.py/clubes/{params.slug}
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
