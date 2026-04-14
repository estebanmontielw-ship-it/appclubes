import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OgImage() {
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
        {/* Red accent bar — matches LNB brand color */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #dc2626, #ef4444, #f87171)",
            display: "flex",
          }}
        />

        {/* Decorative circle top-right */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.08)",
            display: "flex",
          }}
        />
        {/* Decorative circle bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.08)",
            display: "flex",
          }}
        />

        {/* CPB logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cpb.com.py/favicon-cpb.png"
          width={90}
          height={90}
          style={{ marginBottom: 28, borderRadius: 12 }}
          alt="CPB"
        />

        {/* CALENDARIO label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 80,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 6,
              lineHeight: 1,
            }}
          >
            CALENDARIO
          </span>
        </div>

        {/* Divider with red dot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div style={{ width: 60, height: 3, background: "#374151", borderRadius: 2, display: "flex" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "flex" }} />
          <div style={{ width: 60, height: 3, background: "#374151", borderRadius: 2, display: "flex" }} />
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#93c5fd",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            LNB 2026
          </span>
          <span style={{ color: "#475569", fontSize: 24, display: "flex" }}>·</span>
          <span
            style={{
              color: "#64748b",
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: 1,
            }}
          >
            Fixture y programación
          </span>
        </div>

        {/* URL bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 52,
            color: "#334155",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: 1,
            display: "flex",
          }}
        >
          cpb.com.py/calendario
        </div>
      </div>
    ),
    { ...size }
  )
}
