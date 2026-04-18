import { ImageResponse } from "next/og"
import { type NextRequest } from "next/server"

export const runtime = "edge"

const COMPS: Record<string, {
  accent: string
  accentGlow: string
  dot: string
  label: string
  sublabel: string
}> = {
  lnb:  { accent: "linear-gradient(90deg, #dc2626, #ef4444, #f87171)", accentGlow: "rgba(239,68,68,0.08)",   dot: "#ef4444", label: "LNB",           sublabel: "Liga Nacional de Básquetbol" },
  lnbf: { accent: "linear-gradient(90deg, #be185d, #ec4899, #f9a8d4)", accentGlow: "rgba(236,72,153,0.10)", dot: "#ec4899", label: "LNBF",          sublabel: "Liga Nacional Femenina" },
  u22m: { accent: "linear-gradient(90deg, #1d4ed8, #3b82f6, #93c5fd)", accentGlow: "rgba(59,130,246,0.10)", dot: "#3b82f6", label: "U22 MASCULINO", sublabel: "Torneo de Desarrollo" },
  u22f: { accent: "linear-gradient(90deg, #9d174d, #f43f5e, #fda4af)", accentGlow: "rgba(244,63,94,0.10)",  dot: "#f43f5e", label: "U22 FEMENINO",  sublabel: "Torneo de Desarrollo" },
}

export async function GET(req: NextRequest) {
  const comp = req.nextUrl.searchParams.get("comp") ?? "lnb"
  const cfg = COMPS[comp] ?? COMPS.lnb

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
        {/* Accent bar top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: cfg.accent, display: "flex" }} />

        {/* Decorative circle top-right */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: cfg.accentGlow, display: "flex" }} />
        {/* Decorative circle bottom-left */}
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(59,130,246,0.07)", display: "flex" }} />

        {/* CPB logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cpb.com.py/favicon-cpb.png"
          width={90}
          height={90}
          style={{ marginBottom: 24, borderRadius: 12 }}
          alt="CPB"
        />

        {/* "PROGRAMACIÓN" above the league name */}
        <div style={{ display: "flex", marginBottom: 8 }}>
          <span style={{ color: "#64748b", fontSize: 30, fontWeight: 700, textTransform: "uppercase", letterSpacing: 8, lineHeight: 1 }}>
            PROGRAMACIÓN
          </span>
        </div>

        {/* League name — big */}
        <div style={{ display: "flex", marginBottom: 22 }}>
          <span style={{ color: "white", fontSize: 90, fontWeight: 900, textTransform: "uppercase", letterSpacing: 4, lineHeight: 1 }}>
            {cfg.label}
          </span>
        </div>

        {/* Divider with dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ width: 60, height: 3, background: "#374151", borderRadius: 2, display: "flex" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, display: "flex" }} />
          <div style={{ width: 60, height: 3, background: "#374151", borderRadius: 2, display: "flex" }} />
        </div>

        {/* Subtitle */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ color: "#93c5fd", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
            2026
          </span>
          <span style={{ color: "#475569", fontSize: 24, display: "flex" }}>·</span>
          <span style={{ color: "#64748b", fontSize: 26, fontWeight: 500, letterSpacing: 1 }}>
            {cfg.sublabel}
          </span>
        </div>

        {/* URL watermark bottom-right */}
        <div style={{ position: "absolute", bottom: 30, right: 52, color: "#334155", fontSize: 18, fontWeight: 500, letterSpacing: 1, display: "flex" }}>
          cpb.com.py/programacionlnb
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
