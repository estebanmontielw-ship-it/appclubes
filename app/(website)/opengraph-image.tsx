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
        {/* Blue accent top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #1d4ed8, #2563eb, #3b82f6)",
          }}
        />

        {/* CPB logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cpb.com.py/favicon-cpb.png"
          width={110}
          height={110}
          style={{ marginBottom: 32, borderRadius: 14 }}
          alt="CPB"
        />

        {/* Main title */}
        <div
          style={{
            color: "white",
            fontSize: 58,
            fontWeight: 900,
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: 3,
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Confederación Paraguaya
          <br />
          de Básquetbol
        </div>

        {/* Divider */}
        <div
          style={{
            width: 80,
            height: 3,
            background: "#2563eb",
            borderRadius: 2,
            marginBottom: 20,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            color: "#93c5fd",
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 2,
            textAlign: "center",
          }}
        >
          Liga Nacional de Básquetbol · LNB 2026
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
          }}
        >
          cpb.com.py
        </div>
      </div>
    ),
    { ...size }
  )
}
