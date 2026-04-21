import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { geniusFetch } from "@/lib/genius-sports"

export const dynamic = "force-dynamic"

const SIZE = 1080

function pad2(n: number) { return String(n).padStart(2, "0") }

function formatDate(matchTime: string) {
  const [datePart, timePart] = matchTime.split(" ")
  const [y, m, d] = datePart.split("-")
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const month = months[Number(m) - 1] ?? m
  const timeStr = timePart ? timePart.slice(0, 5) : null
  return { date: `${d} ${month} ${y}`, time: timeStr }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const matchId = searchParams.get("matchId")
  const template = searchParams.get("template") ?? "pre"

  if (!matchId) {
    return new Response("matchId requerido", { status: 400 })
  }

  try {
    const { id: compId } = await resolveLnbCompetitionIdPublic()
    const matchesRaw = await geniusFetch(`/competitions/${compId}/matches?limit=100`, "short")
    const matches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []

    const match = matches.find((m: any) =>
      String(m.matchId) === String(matchId) ||
      String(m.matchExternalId) === String(matchId)
    )

    if (!match) return new Response("Partido no encontrado", { status: 404 })

    const home = (match.competitors ?? []).find((c: any) => Number(c.isHomeCompetitor) === 1) ?? match.competitors?.[0]
    const away = (match.competitors ?? []).find((c: any) => Number(c.isHomeCompetitor) === 0) ?? match.competitors?.[1]

    const homeName: string = home?.competitorName ?? "Local"
    const awayName: string = away?.competitorName ?? "Visitante"
    const homeLogo: string | null = home?.images?.logo?.L1?.url ?? home?.images?.logo?.S1?.url ?? null
    const awayLogo: string | null = away?.images?.logo?.L1?.url ?? away?.images?.logo?.S1?.url ?? null
    const homeScore: string | null = template === "resultado" ? (home?.scoreString ?? null) : null
    const awayScore: string | null = template === "resultado" ? (away?.scoreString ?? null) : null
    const { date, time } = formatDate(match.matchTime ?? "")
    const venue: string = match.venue?.venueName ?? match.venueName ?? ""

    const isResultado = template === "resultado"

    return new ImageResponse(
      (
        <div
          style={{
            width: SIZE,
            height: SIZE,
            background: "#0a1628",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            fontFamily: "sans-serif",
          }}
        >
          {/* Top red bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "linear-gradient(90deg, #dc2626, #ef4444)", display: "flex" }} />

          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(239,68,68,0.07)", display: "flex" }} />
          <div style={{ position: "absolute", bottom: -100, left: -100, width: 350, height: 350, borderRadius: "50%", background: "rgba(59,130,246,0.07)", display: "flex" }} />

          {/* Header: LNB badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
            <div style={{ background: "#ef4444", borderRadius: 8, padding: "6px 18px", display: "flex" }}>
              <span style={{ color: "white", fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>LNB 2026</span>
            </div>
            {isResultado && (
              <div style={{ background: "#1e3a5f", borderRadius: 8, padding: "6px 18px", display: "flex" }}>
                <span style={{ color: "#93c5fd", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>RESULTADO FINAL</span>
              </div>
            )}
          </div>

          {/* Teams row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, width: "100%" }}>

            {/* Home team */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 340 }}>
              {homeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={homeLogo} width={180} height={180} style={{ objectFit: "contain", borderRadius: 16 }} alt={homeName} />
              ) : (
                <div style={{ width: 180, height: 180, borderRadius: 16, background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontSize: 48, fontWeight: 900 }}>{homeName.charAt(0)}</span>
                </div>
              )}
              {isResultado && homeScore != null ? (
                <span style={{ color: "white", fontSize: 100, fontWeight: 900, lineHeight: 1, marginTop: 20 }}>{homeScore}</span>
              ) : null}
              <span style={{ color: "#94a3b8", fontSize: 26, fontWeight: 700, marginTop: isResultado ? 12 : 24, textAlign: "center", maxWidth: 300 }}>{homeName}</span>
            </div>

            {/* VS / divider */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 140 }}>
              {isResultado ? (
                <span style={{ color: "#475569", fontSize: 40, fontWeight: 700 }}>–</span>
              ) : (
                <span style={{ color: "#ef4444", fontSize: 64, fontWeight: 900, letterSpacing: -2 }}>VS</span>
              )}
            </div>

            {/* Away team */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 340 }}>
              {awayLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={awayLogo} width={180} height={180} style={{ objectFit: "contain", borderRadius: 16 }} alt={awayName} />
              ) : (
                <div style={{ width: 180, height: 180, borderRadius: 16, background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontSize: 48, fontWeight: 900 }}>{awayName.charAt(0)}</span>
                </div>
              )}
              {isResultado && awayScore != null ? (
                <span style={{ color: "white", fontSize: 100, fontWeight: 900, lineHeight: 1, marginTop: 20 }}>{awayScore}</span>
              ) : null}
              <span style={{ color: "#94a3b8", fontSize: 26, fontWeight: 700, marginTop: isResultado ? 12 : 24, textAlign: "center", maxWidth: 300 }}>{awayName}</span>
            </div>
          </div>

          {/* Date / time / venue strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 56, background: "#0f2644", borderRadius: 20, padding: "18px 48px" }}>
            <span style={{ color: "white", fontSize: 28, fontWeight: 700 }}>{date}</span>
            {time && (
              <>
                <span style={{ color: "#475569", fontSize: 24, display: "flex" }}>·</span>
                <span style={{ color: "#93c5fd", fontSize: 28, fontWeight: 700 }}>{time} hs</span>
              </>
            )}
            {venue && (
              <>
                <span style={{ color: "#475569", fontSize: 24, display: "flex" }}>·</span>
                <span style={{ color: "#64748b", fontSize: 26 }}>{venue}</span>
              </>
            )}
          </div>

          {/* CPB branding bottom */}
          <div style={{ position: "absolute", bottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#334155", fontSize: 22, fontWeight: 500, letterSpacing: 1 }}>cpb.com.py</span>
          </div>
        </div>
      ),
      { width: SIZE, height: SIZE }
    )
  } catch (e: any) {
    return new Response(e.message ?? "Error generando flyer", { status: 500 })
  }
}
