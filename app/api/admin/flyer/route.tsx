import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import {
  resolveLnbCompetitionIdPublic,
  resolveLnbfCompetitionIdPublic,
  resolveU22MCompetitionIdPublic,
  resolveU22FCompetitionIdPublic,
} from "@/lib/programacion-lnb"
import { geniusFetch } from "@/lib/genius-sports"

export const dynamic = "force-dynamic"

const W = 1080

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function formatMatchTime(matchTime: string) {
  if (!matchTime) return { date: "", time: "" }
  const [datePart, timePart] = matchTime.split(" ")
  const [y, m, d] = datePart.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  const dia = DIAS[dt.getDay()]
  const mes = MESES[m - 1]
  const time = timePart ? timePart.slice(0, 5) : ""
  return { date: `${dia} ${d} de ${mes}`, time }
}

interface MatchData {
  homeName: string
  awayName: string
  homeLogo: string | null
  awayLogo: string | null
  homeScore: string | null
  awayScore: string | null
  date: string
  time: string
  venue: string
}

function Logo({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    return (
      <img
        src={url}
        width={size}
        height={size}
        style={{ objectFit: "contain" }}
        alt={name}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: "rgba(255,255,255,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ color: "white", fontSize: size * 0.45, fontWeight: 900 }}>{name.charAt(0)}</span>
    </div>
  )
}

function MatchCard({ match, isResultado, cardW, cardH, logoSize, nameFontSize, vsFontSize }: {
  match: MatchData
  isResultado: boolean
  cardW: number
  cardH: number
  logoSize: number
  nameFontSize: number
  vsFontSize: number
}) {
  return (
    <div style={{
      width: cardW, height: cardH,
      background: "rgba(255,255,255,0.08)",
      borderRadius: 28,
      border: "1.5px solid rgba(255,255,255,0.14)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 32px",
    }}>
      {/* Teams row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>

        {/* Home */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <Logo url={match.homeLogo} name={match.homeName} size={logoSize} />
          {isResultado && match.homeScore != null && (
            <span style={{ color: "white", fontSize: vsFontSize * 1.6, fontWeight: 900, marginTop: 8, lineHeight: 1 }}>
              {match.homeScore}
            </span>
          )}
          <span style={{
            color: "white", fontSize: nameFontSize, fontWeight: 700,
            marginTop: isResultado ? 6 : 14, textAlign: "center",
            maxWidth: cardW * 0.35,
          }}>{match.homeName}</span>
        </div>

        {/* VS */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 80 }}>
          <span style={{
            color: isResultado ? "rgba(255,255,255,0.3)" : "#f97316",
            fontSize: vsFontSize,
            fontWeight: 900,
            letterSpacing: isResultado ? 0 : -2,
          }}>
            {isResultado ? "–" : "VS"}
          </span>
        </div>

        {/* Away */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <Logo url={match.awayLogo} name={match.awayName} size={logoSize} />
          {isResultado && match.awayScore != null && (
            <span style={{ color: "white", fontSize: vsFontSize * 1.6, fontWeight: 900, marginTop: 8, lineHeight: 1 }}>
              {match.awayScore}
            </span>
          )}
          <span style={{
            color: "white", fontSize: nameFontSize, fontWeight: 700,
            marginTop: isResultado ? 6 : 14, textAlign: "center",
            maxWidth: cardW * 0.35,
          }}>{match.awayName}</span>
        </div>
      </div>

      {/* Info bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 16, marginTop: 18,
        background: "rgba(0,0,0,0.3)", borderRadius: 12,
        padding: "10px 24px", width: "90%",
      }}>
        {match.venue && (
          <>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 20, fontWeight: 600 }}>{match.venue}</span>
            {(match.date || match.time) && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, display: "flex" }}>·</span>}
          </>
        )}
        {match.date && (
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 20, fontWeight: 600 }}>{match.date}</span>
        )}
        {match.time && (
          <>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, display: "flex" }}>·</span>
            <span style={{ color: "#fbbf24", fontSize: 20, fontWeight: 700 }}>{match.time} hs</span>
          </>
        )}
      </div>
    </div>
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const matchIdsParam = searchParams.get("matchIds") ?? searchParams.get("matchId") ?? ""
  const template = searchParams.get("template") ?? "pre"
  const titulo = searchParams.get("titulo") ?? ""
  const subtitulo = searchParams.get("subtitulo") ?? ""
  const logoUrl = searchParams.get("logoUrl") ?? ""
  const s1 = searchParams.get("s1") ?? ""
  const s2 = searchParams.get("s2") ?? ""
  const s3 = searchParams.get("s3") ?? ""
  const sponsorBg = searchParams.get("sponsorBg") ?? "dark"

  const liga = searchParams.get("liga") ?? "lnb"
  const format = searchParams.get("format") ?? "feed"

  const sponsorLogos = [s1, s2, s3].filter(Boolean)

  const matchIds = matchIdsParam.split(",").map(s => s.trim()).filter(Boolean)
  if (matchIds.length === 0) return new Response("matchIds requerido", { status: 400 })

  const isResultado = template === "resultado"

  try {
    const resolvers: Record<string, () => Promise<{ id: string | null; name: string | null }>> = {
      lnb:  resolveLnbCompetitionIdPublic,
      lnbf: resolveLnbfCompetitionIdPublic,
      u22m: resolveU22MCompetitionIdPublic,
      u22f: resolveU22FCompetitionIdPublic,
    }
    const resolve = resolvers[liga] ?? resolveLnbCompetitionIdPublic
    const { id: compId } = await resolve()
    const matchesRaw = await geniusFetch(`/competitions/${compId}/matches?limit=100`, "short")
    const allMatches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []

    const matchDataList: MatchData[] = []

    for (const mid of matchIds) {
      const m = allMatches.find((x: any) =>
        String(x.matchId) === mid || String(x.matchExternalId) === mid
      )
      if (!m) continue

      const home = (m.competitors ?? []).find((c: any) => Number(c.isHomeCompetitor) === 1) ?? m.competitors?.[0]
      const away = (m.competitors ?? []).find((c: any) => Number(c.isHomeCompetitor) === 0) ?? m.competitors?.[1]
      const { date, time } = formatMatchTime(m.matchTime ?? "")

      matchDataList.push({
        homeName: home?.competitorName ?? "Local",
        awayName: away?.competitorName ?? "Visitante",
        homeLogo: home?.images?.logo?.L1?.url ?? home?.images?.logo?.S1?.url ?? null,
        awayLogo: away?.images?.logo?.L1?.url ?? away?.images?.logo?.S1?.url ?? null,
        homeScore: isResultado ? (home?.scoreString ?? null) : null,
        awayScore: isResultado ? (away?.scoreString ?? null) : null,
        date,
        time,
        venue: m.venue?.venueName ?? m.venueName ?? "",
      })
    }

    if (matchDataList.length === 0) return new Response("Partidos no encontrados", { status: 404 })

    const count = matchDataList.length
    const isHistoria = format === "historia"
    // Feed 4:5 = 1080×1350, Historia 9:16 = 1080×1920
    const H = isHistoria ? 1920 : (count === 1 ? 1080 : count === 2 ? 1350 : 1620)

    // Card dimensions based on count
    const cardW = W - 80
    const cardH = count === 1 ? 480 : count === 2 ? 420 : 340
    const logoSize = count === 1 ? 150 : count === 2 ? 130 : 100
    const nameFontSize = count === 1 ? 28 : 24
    const vsFontSize = count === 1 ? 58 : 48

    const headerH = count === 1 ? 280 : 260
    const gapBetweenCards = count === 1 ? 0 : 20

    return new ImageResponse(
      (
        <div style={{
          width: W, height: H,
          background: "linear-gradient(160deg, #0b1e3d 0%, #0d2550 50%, #091830 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background glow effects */}
          <div style={{
            position: "absolute", top: -200, left: -200,
            width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(30,80,160,0.35) 0%, transparent 70%)",
            display: "flex",
          }} />
          <div style={{
            position: "absolute", bottom: -200, right: -200,
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(15,60,120,0.3) 0%, transparent 70%)",
            display: "flex",
          }} />

          {/* ── HEADER ── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: headerH, width: "100%",
            gap: 0,
          }}>
            {/* Logo — solo si el usuario subió uno */}
            {logoUrl ? (
              <img
                src={logoUrl}
                width={count === 1 ? 100 : 80}
                height={count === 1 ? 100 : 80}
                style={{ objectFit: "contain", marginBottom: 16 }}
                alt="Logo"
              />
            ) : null}

            {/* Subtítulo del usuario (si lo puso) */}
            {subtitulo ? (
              <span style={{
                color: "rgba(255,255,255,0.55)", fontSize: 22, fontWeight: 600,
                letterSpacing: 4, marginBottom: 10, textAlign: "center",
              }}>
                {subtitulo.toUpperCase()}
              </span>
            ) : null}

            {/* Título principal */}
            {titulo ? (
              <span style={{
                color: "white", fontSize: count === 1 ? 72 : 60, fontWeight: 900,
                letterSpacing: -1, textAlign: "center", lineHeight: 1,
              }}>
                {titulo.toUpperCase()}
              </span>
            ) : (
              <span style={{ color: "white", fontSize: 48, fontWeight: 900, letterSpacing: 2 }}>
                {isResultado ? "RESULTADOS" : "PRÓXIMOS PARTIDOS"}
              </span>
            )}
          </div>

          {/* ── MATCH CARDS ── */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: gapBetweenCards,
            flex: 1, justifyContent: "center",
            width: "100%", paddingBottom: 20,
          }}>
            {matchDataList.map((match, i) => (
              <MatchCard
                key={i}
                match={match}
                isResultado={isResultado}
                cardW={cardW}
                cardH={cardH}
                logoSize={logoSize}
                nameFontSize={nameFontSize}
                vsFontSize={vsFontSize}
              />
            ))}
          </div>

          {/* ── FOOTER / SPONSORS ── */}
          {sponsorLogos.length > 0 ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", height: 120,
              background: sponsorBg === "white" ? "rgba(255,255,255,0.97)" : "rgba(0,0,0,0.55)",
              gap: 48, padding: "0 60px",
            }}>
              {sponsorLogos.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  width={180}
                  height={72}
                  style={{ objectFit: "contain", flex: "0 0 auto" }}
                  alt={`Sponsor ${i + 1}`}
                />
              ))}
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 60, width: "100%",
            }}>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 18, fontWeight: 500, letterSpacing: 2 }}>
                cpb.com.py
              </span>
            </div>
          )}
        </div>
      ),
      { width: W, height: H }
    )
  } catch (e: any) {
    return new Response(e.message ?? "Error generando flyer", { status: 500 })
  }
}
