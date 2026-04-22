import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import {
  resolveLnbCompetitionIdPublic,
  resolveLnbfCompetitionIdPublic,
  resolveU22MCompetitionIdPublic,
  resolveU22FCompetitionIdPublic,
} from "@/lib/programacion-lnb"
import { geniusFetch, getLeadersFromMatches } from "@/lib/genius-sports"
import { normalizeStandings } from "@/lib/normalize-standings"

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

interface StandingsRow {
  rank: number
  name: string
  logo: string | null
  gamesPlayed: number
  wins: number
  losses: number
}

const LOGO_NORM_BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"

function Logo({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    // Pasamos el logo por /api/logo-norm que trimea el padding transparente
    // y reencuadra el contenido en un marco estándar, para que todos los
    // escudos ocupen aprox. el mismo espacio visual aunque los archivos
    // originales tengan distinto padding.
    const normalized = `${LOGO_NORM_BASE}/api/logo-norm?url=${encodeURIComponent(url)}&size=${size}`
    return (
      <img
        src={normalized}
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

function MatchCard({ match, isResultado, cardW, cardH, logoSize, nameFontSize, vsFontSize, cardStyle, tc }: {
  match: MatchData
  isResultado: boolean
  cardW: number
  cardH: number
  logoSize: number
  nameFontSize: number
  vsFontSize: number
  cardStyle: "glass" | "solid" | "minimal"
  tc: Record<string, string>
}) {
  const cardBg = cardStyle === "solid" ? "rgba(0,0,0,0.45)" : cardStyle === "minimal" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)"
  const cardBorder = cardStyle === "solid" ? "none" : cardStyle === "minimal" ? "1.5px solid rgba(255,255,255,0.07)" : "1.5px solid rgba(255,255,255,0.14)"
  return (
    <div style={{
      width: cardW, height: cardH,
      background: cardBg,
      borderRadius: 28,
      border: cardBorder,
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
          {isResultado && match.homeScore != null && (() => {
            const hs = parseInt(match.homeScore ?? "")
            const as_ = parseInt(match.awayScore ?? "")
            const tied = isNaN(hs) || isNaN(as_) || hs === as_
            const homeWins = !tied && hs > as_
            return (
              <span style={{ color: tc.score, fontSize: vsFontSize * 1.6, fontWeight: tied ? 700 : (homeWins ? 900 : 500), marginTop: 8, lineHeight: 1 }}>
                {match.homeScore}
              </span>
            )
          })()}
          {(() => {
            const hs = parseInt(match.homeScore ?? "")
            const as_ = parseInt(match.awayScore ?? "")
            const tied = isNaN(hs) || isNaN(as_) || hs === as_
            const homeWins = !tied && hs > as_
            return (
              <span style={{
                color: tc.team, fontSize: nameFontSize, fontWeight: isResultado ? (homeWins ? 900 : 600) : 700,
                marginTop: isResultado ? 6 : 14, textAlign: "center",
                maxWidth: cardW * 0.35,
              }}>{match.homeName}</span>
            )
          })()}
        </div>

        {/* VS */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 80 }}>
          <span style={{
            color: isResultado ? tc.dot : "white",
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
          {isResultado && match.awayScore != null && (() => {
            const hs = parseInt(match.homeScore ?? "")
            const as_ = parseInt(match.awayScore ?? "")
            const tied = isNaN(hs) || isNaN(as_) || hs === as_
            const awayWins = !tied && as_ > hs
            return (
              <span style={{ color: tc.score, fontSize: vsFontSize * 1.6, fontWeight: tied ? 700 : (awayWins ? 900 : 500), marginTop: 8, lineHeight: 1 }}>
                {match.awayScore}
              </span>
            )
          })()}
          {(() => {
            const hs = parseInt(match.homeScore ?? "")
            const as_ = parseInt(match.awayScore ?? "")
            const tied = isNaN(hs) || isNaN(as_) || hs === as_
            const awayWins = !tied && as_ > hs
            return (
              <span style={{
                color: tc.team, fontSize: nameFontSize, fontWeight: isResultado ? (awayWins ? 900 : 600) : 700,
                marginTop: isResultado ? 6 : 14, textAlign: "center",
                maxWidth: cardW * 0.35,
              }}>{match.awayName}</span>
            )
          })()}
        </div>
      </div>

      {/* Info bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 16, marginTop: 18,
        background: tc.infoBg, borderRadius: 12,
        padding: "10px 24px", width: "90%",
      }}>
        {match.venue && (
          <>
            <span style={{ color: tc.venue, fontSize: 20, fontWeight: 600 }}>{match.venue}</span>
            {(match.date || match.time) && <span style={{ color: tc.dot, fontSize: 18, display: "flex" }}>·</span>}
          </>
        )}
        {match.date && (
          <span style={{ color: tc.venue, fontSize: 20, fontWeight: 600 }}>{match.date}</span>
        )}
        {match.time && (
          <>
            <span style={{ color: tc.dot, fontSize: 18, display: "flex" }}>·</span>
            <span style={{ color: "white", fontSize: 20, fontWeight: 800 }}>{match.time} hs</span>
          </>
        )}
      </div>
    </div>
  )
}

// Opción 2: Compacto — home/away en 2 filas con nombre, tiempo/score a la
// derecha, strip inferior con fecha + venue.
function MatchCardCompact({ match, isResultado, cardW, cardH, tc, cardBg, cardBorder }: {
  match: MatchData; isResultado: boolean; cardW: number; cardH: number
  tc: Record<string, string>; cardBg: string; cardBorder: string
}) {
  const hs = parseInt(match.homeScore ?? "")
  const as_ = parseInt(match.awayScore ?? "")
  const tied = isNaN(hs) || isNaN(as_) || hs === as_
  const homeWins = !tied && hs > as_
  const logoSz = Math.round(cardH * 0.30)
  const teamFontSize = Math.max(18, Math.min(34, Math.round(cardH * 0.12)))
  const timeFontSize = Math.round(cardH * 0.36)
  const scoreFontSize = Math.round(cardH * 0.36)
  const metaFontSize = Math.max(12, Math.round(cardH * 0.085))
  const hasMeta = !!(match.date || match.venue)

  return (
    <div style={{ width: cardW, height: cardH, background: cardBg, borderRadius: 20, border: cardBorder, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Main row: teams (left) + time/score (right) */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", width: "100%" }}>
        {/* Teams column — home row + away row */}
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 8, padding: "10px 20px", minWidth: 0 }}>
          {/* Home */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
            <Logo url={match.homeLogo} name={match.homeName} size={logoSz} />
            <span style={{
              color: tc.team,
              fontSize: teamFontSize,
              fontWeight: isResultado ? (!tied && homeWins ? 900 : 600) : 700,
              letterSpacing: 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}>
              {match.homeName}
            </span>
          </div>
          {/* Away */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
            <Logo url={match.awayLogo} name={match.awayName} size={logoSz} />
            <span style={{
              color: tc.team,
              fontSize: teamFontSize,
              fontWeight: isResultado ? (!tied && !homeWins ? 900 : 600) : 700,
              letterSpacing: 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}>
              {match.awayName}
            </span>
          </div>
        </div>
        {/* Divider + Time/Score */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          paddingLeft: 18, paddingRight: 24,
          borderLeft: "1px solid rgba(255,255,255,0.10)",
          minWidth: Math.round(cardW * 0.30),
          alignSelf: "stretch",
        }}>
          {isResultado && match.homeScore != null ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ color: tc.score, fontSize: scoreFontSize, fontWeight: tied ? 700 : (homeWins ? 900 : 500), lineHeight: 1 }}>{match.homeScore}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: Math.round(scoreFontSize * 0.55), fontWeight: 700 }}>–</span>
              <span style={{ color: tc.score, fontSize: scoreFontSize, fontWeight: tied ? 700 : (!homeWins ? 900 : 500), lineHeight: 1 }}>{match.awayScore}</span>
            </div>
          ) : (
            <span style={{ color: "white", fontSize: timeFontSize, fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>
              {match.time || "–"}
            </span>
          )}
        </div>
      </div>
      {/* Bottom meta strip: fecha · venue */}
      {hasMeta && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, padding: "7px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.25)",
          width: "100%",
        }}>
          {match.date ? (
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: metaFontSize, fontWeight: 600, display: "flex" }}>
              {match.date}
            </span>
          ) : null}
          {match.date && match.venue ? (
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: metaFontSize, display: "flex" }}>·</span>
          ) : null}
          {match.venue ? (
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: metaFontSize, fontWeight: 500, display: "flex", overflow: "hidden", whiteSpace: "nowrap" }}>
              {match.venue}
            </span>
          ) : null}
        </div>
      )}
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
  const logoScale = parseFloat(searchParams.get("logoScale") ?? "100") / 100
  const theme = searchParams.get("theme") ?? "masc1"
  const s1 = searchParams.get("s1") ?? ""
  const s2 = searchParams.get("s2") ?? ""
  const s3 = searchParams.get("s3") ?? ""
  const s1scale = parseFloat(searchParams.get("s1scale") ?? "1")
  const s2scale = parseFloat(searchParams.get("s2scale") ?? "1")
  const s3scale = parseFloat(searchParams.get("s3scale") ?? "1")
  const sponsorBg = searchParams.get("sponsorBg") ?? "dark"
  const textureUrl = searchParams.get("textureUrl") ?? ""
  const textureOpacity = Math.min(40, Math.max(1, parseInt(searchParams.get("textureOpacity") ?? "12")))
  const bgImageUrl = searchParams.get("bgImageUrl") ?? ""

  const s4 = searchParams.get("s4") ?? ""
  const s5 = searchParams.get("s5") ?? ""
  const s4scale = parseFloat(searchParams.get("s4scale") ?? "1")
  const s5scale = parseFloat(searchParams.get("s5scale") ?? "1")
  const titleSize = Math.min(200, Math.max(40, parseFloat(searchParams.get("titleSize") ?? "100"))) / 100
  const subtitleSize = Math.min(200, Math.max(40, parseFloat(searchParams.get("subtitleSize") ?? "100"))) / 100
  const cardStyle = (searchParams.get("cardStyle") ?? "glass") as "glass" | "solid" | "minimal"
  const textColor = (searchParams.get("textColor") ?? "light") as "light" | "dark"

  const liga = searchParams.get("liga") ?? "lnb"
  const format = searchParams.get("format") ?? "feed"
  const layout = (searchParams.get("layout") ?? "default") as "default" | "compact"
  const titleWeight = parseInt(searchParams.get("titleWeight") ?? "900")

  // New template params
  const isTabla    = template === "tabla"
  const isLideres  = template === "lideres"
  const isJugador  = template === "jugador"
  const statType   = (searchParams.get("statType") ?? "scoring") as "scoring" | "assists" | "rebounds"
  const playerPhotoUrl = searchParams.get("playerPhoto") ?? ""
  const jugadorNombre  = searchParams.get("jugadorNombre") ?? ""
  const jugadorClub    = searchParams.get("jugadorClub") ?? ""
  const jugadorPremio  = searchParams.get("jugadorPremio") ?? "BROU"
  const jugadorFecha   = searchParams.get("jugadorFecha") ?? ""
  const jugadorTeamLogo = searchParams.get("jugadorTeamLogo") ?? ""

  // Encuadre de imágenes (cover = llena y recorta, contain = ve todo con márgenes)
  const bgFit = (searchParams.get("bgFit") ?? "cover") as "cover" | "contain"
  const photoFit = (searchParams.get("photoFit") ?? "cover") as "cover" | "contain"

  // Text color palette
  const tc = {
    title:    textColor === "dark" ? "#111827" : "white",
    subtitle: textColor === "dark" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.55)",
    team:     textColor === "dark" ? "#111827" : "white",
    venue:    textColor === "dark" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.65)",
    dot:      textColor === "dark" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)",
    time:     "white",
    score:    textColor === "dark" ? "#111827" : "white",
    scoreDim: textColor === "dark" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.3)",
    infoBg:   textColor === "dark" ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.3)",
    default:  textColor === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.2)",
  }

  const sponsorLogos = [
    { url: s1, scale: s1scale },
    { url: s2, scale: s2scale },
    { url: s3, scale: s3scale },
    { url: s4, scale: s4scale },
    { url: s5, scale: s5scale },
  ].filter((s) => Boolean(s.url))

  const matchIds = matchIdsParam.split(",").map(s => s.trim()).filter(Boolean)
  if (matchIds.length === 0 && !isTabla && !isLideres && !isJugador) return new Response("matchIds requerido", { status: 400 })

  const isResultado = template === "resultado"

  // Shared theme gradient
  const THEME_BG: Record<string, string> = {
    masc1: "linear-gradient(160deg, #0b1e3d 0%, #0d2550 50%, #091830 100%)",
    masc2: "linear-gradient(160deg, #0a2e6e 0%, #0c3a8a 50%, #061a4a 100%)",
    fem1:  "linear-gradient(160deg, #2d0a4e 0%, #3d1260 50%, #1a0630 100%)",
    fem2:  "linear-gradient(160deg, #4a0a1a 0%, #5c1020 50%, #2a0610 100%)",
  }
  const themeBg = bgImageUrl ? "#000" : (THEME_BG[theme] ?? THEME_BG.masc1)

  try {
    const resolvers: Record<string, () => Promise<{ id: string | null; name: string | null }>> = {
      lnb:  resolveLnbCompetitionIdPublic,
      lnbf: resolveLnbfCompetitionIdPublic,
      u22m: resolveU22MCompetitionIdPublic,
      u22f: resolveU22FCompetitionIdPublic,
    }
    const resolve = resolvers[liga] ?? resolveLnbCompetitionIdPublic
    const { id: compId } = await resolve()

    // ── TABLA DE POSICIONES ──
    if (isTabla) {
      const standingsRaw = await geniusFetch(`/competitions/${compId}/standings`, "short")
      const allRows = normalizeStandings(standingsRaw).sort((a, b) => a.rank - b.rank)
      if (allRows.length === 0) return new Response("No hay datos de tabla disponibles", { status: 404 })

      const H = format === "historia" ? 1920 : 1350
      const vMult = format === "historia" ? 1.4 : 1.0
      const headerH = Math.round(240 * vMult)
      const footerH = sponsorLogos.length > 0 ? Math.round(130 * vMult) : Math.round(60 * vMult)
      // Calculamos dinámicamente el alto de cada fila para que la tabla
      // llene todo el espacio disponible del canvas. Antes era fijo en 60px
      // y quedaba un hueco gigante en Historia 9:16. Topamos con un máx
      // razonable (130px) para que con pocas filas no se estire sin sentido
      // ni los textos queden gigantes.
      const rowsCount = allRows.length
      const rowGap = Math.round(6 * vMult)
      const colHeaderH = Math.round(30 * vMult)
      const blockPaddingV = Math.round(30 * vMult)
      const availableForRows = H - headerH - footerH - colHeaderH - blockPaddingV
      const rowH = Math.min(
        160,
        Math.max(60, Math.floor((availableForRows - rowGap * (rowsCount - 1)) / rowsCount))
      )
      // Fuentes/logos proporcionales al rowH, con tope para que no se vean
      // desproporcionadas cuando la fila es muy alta.
      const rankFontSize   = Math.min(28, Math.round(rowH * 0.36))
      const teamFontSize   = Math.min(26, Math.round(rowH * 0.32))
      // En Stories el logo tiene que ser bien grande (porque es el único
      // identificador del equipo — ocultamos el nombre para dar espacio a
      // los stats); en Feed mostramos ambos.
      const isStory = format === "historia"
      const rowLogoSize = isStory
        ? Math.min(90, Math.round(rowH * 0.80))
        : Math.min(55, Math.round(rowH * 0.65))
      const statFontSize   = Math.min(22, Math.round(rowH * 0.30))
      const statSecondary  = Math.min(18, Math.round(rowH * 0.26))
      const colHeaderFont  = Math.round(14 * vMult)
      const tituloFinal = titulo || "TABLA DE POSICIONES"

      return new ImageResponse(
        (
          <div style={{ width: W, height: H, background: themeBg, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "sans-serif", position: "relative", overflow: "hidden" }}>
            {bgImageUrl ? <img src={bgImageUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: bgFit, display: "flex" }} alt="" /> : null}
            {textureUrl && !bgImageUrl ? <img src={textureUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover", opacity: textureOpacity / 100, display: "flex" }} alt="" /> : null}
            <div style={{ position: "absolute", top: -200, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,80,160,0.35) 0%, transparent 70%)", display: "flex" }} />
            <div style={{ position: "absolute", bottom: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(15,60,120,0.3) 0%, transparent 70%)", display: "flex" }} />

            {/* HEADER */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", height: headerH, width: "100%", gap: 0, paddingTop: Math.round(36 * vMult) }}>
              {logoUrl ? <img src={logoUrl} width={Math.round(90 * vMult * logoScale)} height={Math.round(90 * vMult * logoScale)} style={{ objectFit: "contain", marginBottom: Math.round(14 * vMult) }} alt="Logo" /> : null}
              {subtitulo ? <span style={{ color: tc.subtitle, fontSize: Math.round(22 * vMult * subtitleSize), fontWeight: 600, letterSpacing: 4, marginBottom: Math.round(10 * vMult), textAlign: "center" }}>{subtitulo.toUpperCase()}</span> : null}
              <span style={{ color: tc.title, fontSize: Math.round(60 * vMult * titleSize), fontWeight: titleWeight, letterSpacing: -1, textAlign: "center", lineHeight: 1 }}>{tituloFinal.toUpperCase()}</span>
            </div>

            {/* STANDINGS TABLE */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "flex-start", width: "100%", paddingTop: Math.round(10 * vMult), paddingBottom: Math.round(16 * vMult), paddingLeft: Math.round(36 * vMult), paddingRight: Math.round(36 * vMult) }}>
              {/* Column headers */}
              <div style={{ display: "flex", alignItems: "center", width: "100%", paddingLeft: 20, paddingRight: 20, marginBottom: rowGap, height: colHeaderH }}>
                <div style={{ display: "flex", width: Math.round(44 * vMult) }}><span style={{ color: tc.subtitle, fontSize: colHeaderFont, fontWeight: 700 }}>#</span></div>
                <div style={{ display: "flex", width: Math.round(48 * vMult) }} />
                <div style={{ display: "flex", flex: 1, marginLeft: 10 }}>
                  {!isStory && <span style={{ color: tc.subtitle, fontSize: colHeaderFont, fontWeight: 700 }}>EQUIPO</span>}
                </div>
                {(["PJ","G","P","Pts","%","PF","PC","Dif"] as const).map((h) => (
                  <div key={h} style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}>
                    <span style={{ color: tc.subtitle, fontSize: colHeaderFont, fontWeight: 700 }}>{h}</span>
                  </div>
                ))}
              </div>
              {/* Rows */}
              <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: rowGap }}>
                {allRows.map((row) => {
                  const isTop4 = row.rank <= 4
                  const cardBg = cardStyle === "solid" ? "rgba(0,0,0,0.45)" : cardStyle === "minimal" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)"
                  const rowBg = isTop4 ? "rgba(255,255,255,0.12)" : cardBg
                  const pts = row.wins * 2 + row.losses
                  const pct = row.gamesPlayed > 0 ? Math.round((row.wins / row.gamesPlayed) * 100) + "%" : "—"
                  const pf = row.pointsFor ?? "—"
                  const pc = row.pointsAgainst ?? "—"
                  const dif = row.pointDiff != null ? (row.pointDiff > 0 ? `+${row.pointDiff}` : String(row.pointDiff)) : "—"
                  return (
                    <div key={row.rank} style={{ display: "flex", alignItems: "center", width: "100%", height: rowH, background: rowBg, borderRadius: Math.round(10 * vMult), paddingLeft: 20, paddingRight: 20 }}>
                      <div style={{ display: "flex", width: Math.round(44 * vMult) }}>
                        <span style={{ color: tc.subtitle, fontSize: rankFontSize, fontWeight: isTop4 ? 900 : 600 }}>{row.rank}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", width: rowLogoSize, height: rowLogoSize }}>
                        {row.teamLogo ? <img src={row.teamLogo} width={rowLogoSize} height={rowLogoSize} style={{ objectFit: "contain" }} alt={row.teamName} /> : <div style={{ width: rowLogoSize, height: rowLogoSize, borderRadius: rowLogoSize / 2, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "white", fontSize: Math.round(rowLogoSize * 0.4), fontWeight: 900 }}>{row.teamName.charAt(0)}</span></div>}
                      </div>
                      <div style={{ display: "flex", flex: 1, marginLeft: 10, overflow: "hidden" }}>
                        {!isStory && (
                          <span style={{ color: tc.team, fontSize: teamFontSize, fontWeight: isTop4 ? 900 : 700, whiteSpace: "nowrap", overflow: "hidden" }}>{row.teamName}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}><span style={{ color: tc.subtitle, fontSize: statFontSize }}>{row.gamesPlayed}</span></div>
                      <div style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}><span style={{ color: tc.team, fontSize: statFontSize, fontWeight: isTop4 ? 900 : 600 }}>{row.wins}</span></div>
                      <div style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}><span style={{ color: tc.subtitle, fontSize: statFontSize }}>{row.losses}</span></div>
                      <div style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}><span style={{ color: tc.team, fontSize: statFontSize, fontWeight: isTop4 ? 900 : 600 }}>{pts}</span></div>
                      <div style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}><span style={{ color: tc.subtitle, fontSize: statSecondary }}>{pct}</span></div>
                      <div style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}><span style={{ color: tc.subtitle, fontSize: statSecondary }}>{pf}</span></div>
                      <div style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}><span style={{ color: tc.subtitle, fontSize: statSecondary }}>{pc}</span></div>
                      <div style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}><span style={{ color: (row.pointDiff ?? 0) > 0 ? "#22c55e" : (row.pointDiff ?? 0) < 0 ? "#ef4444" : tc.subtitle, fontSize: statSecondary, fontWeight: 600 }}>{dif}</span></div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* FOOTER */}
            {sponsorLogos.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: footerH, background: sponsorBg === "white" ? "rgba(255,255,255,0.97)" : "rgba(0,0,0,0.6)", gap: Math.round(56 * vMult), padding: "0 60px" }}>
                {sponsorLogos.map((s, i) => { const h = Math.round(70 * vMult * s.scale); return <img key={i} src={s.url} width={Math.round(220 * vMult * s.scale)} height={h} style={{ objectFit: "contain", flex: "0 0 auto" }} alt={`Sponsor ${i + 1}`} /> })}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: footerH, width: "100%" }}>
                <span style={{ color: tc.default, fontSize: Math.round(18 * vMult), fontWeight: 500, letterSpacing: 2 }}>cpb.com.py</span>
              </div>
            )}
          </div>
        ),
        { width: W, height: H, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
      )
    }

    // ── JUGADOR DEL PARTIDO ──
    if (isJugador) {
      const H = format === "historia" ? 1920 : 1350
      return new ImageResponse(
        (
          <div style={{ width: W, height: H, display: "flex", fontFamily: "sans-serif", position: "relative", overflow: "hidden", background: "#0b1e3d" }}>
            {playerPhotoUrl ? <img src={playerPhotoUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: photoFit, objectPosition: "top center", display: "flex" }} alt={jugadorNombre} /> : <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, background: themeBg, display: "flex" }} />}
            {textureUrl ? <img src={textureUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover", opacity: textureOpacity / 100, display: "flex" }} alt="" /> : null}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)", display: "flex" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: Math.round(H * 0.42), background: "linear-gradient(180deg, transparent 0%, rgba(10,20,50,0.92) 30%, rgba(10,20,50,0.98) 100%)", display: "flex" }} />
            {logoUrl ? <img src={logoUrl} width={Math.round(80 * logoScale)} height={Math.round(80 * logoScale)} style={{ position: "absolute", top: 36, left: 36, objectFit: "contain", display: "flex" }} alt="Logo" /> : null}
            {jugadorTeamLogo ? <img src={jugadorTeamLogo} width={120} height={120} style={{ position: "absolute", top: Math.round(H * 0.38), left: 48, objectFit: "contain", display: "flex" }} alt={jugadorClub} /> : null}
            <div style={{ position: "absolute", bottom: Math.round(H * 0.24), left: 48, right: 48, display: "flex", flexDirection: "column" }}>
              <span style={{ color: "white", fontSize: Math.round(80 * titleSize), fontWeight: titleWeight, lineHeight: 0.9, letterSpacing: -3 }}>JUGADOR</span>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 4 }}>
                <span style={{ color: "white", fontSize: Math.round(80 * titleSize), fontWeight: titleWeight, lineHeight: 0.9, letterSpacing: -3 }}>{jugadorPremio.toUpperCase()}</span>
                {jugadorFecha ? <div style={{ display: "flex", background: "rgba(255,255,255,0.15)", borderRadius: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6 }}><span style={{ color: "white", fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>{jugadorFecha.toUpperCase()}</span></div> : null}
              </div>
            </div>
            <div style={{ position: "absolute", bottom: Math.round(H * 0.11), left: 48, right: 48, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "white", fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>{jugadorNombre.toUpperCase()}</span>
              {jugadorClub ? <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 20, fontWeight: 600, letterSpacing: 2 }}>{jugadorClub.toUpperCase()}</span> : null}
            </div>
            {sponsorLogos.length > 0 ? (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: sponsorBg === "white" ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
                {sponsorLogos.map((s, i) => { const h = Math.round(48 * s.scale); return <img key={i} src={s.url} width={Math.round(150 * s.scale)} height={h} style={{ objectFit: "contain" }} alt={`Sponsor ${i + 1}`} /> })}
              </div>
            ) : <div style={{ position: "absolute", bottom: 28, right: 48, display: "flex" }}><span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, letterSpacing: 2 }}>CPB · cpb.com.py</span></div>}
          </div>
        ),
        { width: W, height: H, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
      )
    }

    // ── LÍDERES ──
    if (isLideres) {
      const leaders = await getLeadersFromMatches(compId!)
      const rows = (statType === "assists" ? leaders.assists : statType === "rebounds" ? leaders.rebounds : leaders.scoring).slice(0, 10)
      if (rows.length === 0) return new Response("Sin datos de líderes aún", { status: 404 })
      const STAT_LABELS: Record<string, string> = { scoring: "PUNTOS", assists: "ASISTENCIAS", rebounds: "REBOTES" }
      const STAT_UNIT:  Record<string, string> = { scoring: "PTS/PJ", assists: "AST/PJ", rebounds: "REB/PJ" }
      const statLabel = STAT_LABELS[statType] ?? "PUNTOS"
      const statUnit  = STAT_UNIT[statType] ?? "PTS/PJ"
      const leader = rows[0]
      const H = format === "historia" ? 1920 : 1350
      const tituloFinal = titulo || `Líder en ${statLabel.toLowerCase()}`
      const photoSrc = playerPhotoUrl || leader.photoUrl || ""
      return new ImageResponse(
        (
          <div style={{ width: W, height: H, display: "flex", fontFamily: "sans-serif", position: "relative", overflow: "hidden", background: "#0b1e3d" }}>
            {photoSrc ? <img src={photoSrc} width={Math.round(W * 0.55)} height={H} style={{ position: "absolute", top: 0, left: 0, width: Math.round(W * 0.55), height: H, objectFit: photoFit, objectPosition: "top center", display: "flex" }} alt={leader.playerName} /> : null}
            {textureUrl ? <img src={textureUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover", opacity: textureOpacity / 100, display: "flex" }} alt="" /> : null}
            <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, background: "linear-gradient(90deg, transparent 0%, rgba(11,30,61,0.3) 30%, rgba(11,30,61,0.88) 52%, rgba(11,30,61,0.97) 65%, #0b1e3d 80%)", display: "flex" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: "linear-gradient(180deg, rgba(11,30,61,0.6) 0%, transparent 100%)", display: "flex" }} />
            <div style={{ position: "absolute", top: 32, left: 32, display: "flex", alignItems: "center", gap: 10 }}>
              {logoUrl ? <img src={logoUrl} width={Math.round(72 * logoScale)} height={Math.round(72 * logoScale)} style={{ objectFit: "contain" }} alt="Logo" /> : null}
            </div>
            <div style={{ position: "absolute", top: 0, right: 0, width: Math.round(W * 0.52), height: H, display: "flex", flexDirection: "column", paddingTop: 40, paddingBottom: 40, paddingLeft: 24, paddingRight: 36 }}>
              <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, fontWeight: 700, letterSpacing: 3, marginBottom: 6 }}>{statLabel}</span>
                <span style={{ color: "white", fontSize: Math.round(42 * titleSize), fontWeight: titleWeight, lineHeight: 1.1, letterSpacing: -1 }}>{tituloFinal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10, paddingRight: 4 }}>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>{statUnit}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, justifyContent: "center" }}>
                {rows.map((r: any, i: number) => {
                  const isFirst = i === 0
                  const rowH = H > 1500 ? 100 : 82
                  const rowBg = isFirst ? "rgba(34,197,94,0.18)" : (cardStyle === "solid" ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.06)")
                  const rowBorder = isFirst ? "1.5px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.07)"
                  return (
                    <div key={r.rank} style={{ display: "flex", alignItems: "center", height: rowH, background: rowBg, borderRadius: 12, border: rowBorder, paddingLeft: 14, paddingRight: 14, gap: 10 }}>
                      <div style={{ display: "flex", width: 38, height: 38, alignItems: "center", justifyContent: "center" }}>
                        {r.teamLogo ? <img src={r.teamLogo} width={36} height={36} style={{ objectFit: "contain", display: "flex" }} alt={r.teamName} /> : <div style={{ width: 36, height: 36, borderRadius: 18, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "white", fontSize: 14, fontWeight: 700 }}>{r.teamSigla?.slice(0,2) ?? "?"}</span></div>}
                      </div>
                      <div style={{ display: "flex", flex: 1 }}>
                        <span style={{ color: isFirst ? "#22c55e" : tc.team, fontSize: isFirst ? 22 : 18, fontWeight: isFirst ? 900 : 700, letterSpacing: 0.5 }}>
                          {r.playerName.split(" ").map((w: string, wi: number) => wi === 0 ? w[0] + "." : w).join(" ").toUpperCase()}
                        </span>
                      </div>
                      <span style={{ color: isFirst ? "#22c55e" : "white", fontSize: isFirst ? 30 : 22, fontWeight: 900, letterSpacing: -1, minWidth: 60, textAlign: "right" }}>{r.value.toFixed(1)}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 20 }}>
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, letterSpacing: 2 }}>CPB · cpb.com.py</span>
              </div>
            </div>
            {sponsorLogos.length > 0 ? (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: sponsorBg === "white" ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
                {sponsorLogos.map((s, i) => { const h = Math.round(44 * s.scale); return <img key={i} src={s.url} width={Math.round(140 * s.scale)} height={h} style={{ objectFit: "contain" }} alt={`Sponsor ${i + 1}`} /> })}
              </div>
            ) : null}
          </div>
        ),
        { width: W, height: H, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
      )
    }

    // ── MATCH CARDS (pre / resultado) ──
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
    // Always respect the selected format — Feed is always 1350, Historia always 1920
    const H = format === "historia" ? 1920 : 1350

    // Multiplier vertical: Historia tiene 570px extra de alto que antes
    // quedaban en blanco. Todo lo que depende de la altura (tarjetas,
    // logos, fuentes, header, paddings) escala por este factor para que
    // el flyer aproveche bien el espacio.
    const vMult = format === "historia" ? 1.4 : 1.0

    // Card dimensions that fit within the fixed height
    // Feed 1350: header + cards + gaps(16×(n-1)) + footer(60-130) must be ≤ 1350
    const cardW = W - 80
    // Respiro vertical entre el header y la primera tarjeta (antes todo
    // quedaba pegado). Le restamos ese padding al cardH de cada partido.
    const headerToCardsPadding = Math.round((count === 1 ? 30 : count === 2 ? 20 : count === 3 ? 14 : 10) * vMult)
    const rawCardH     = Math.round((count === 1 ? 480 : count === 2 ? 400 : count === 3 ? 295 : 240) * vMult)
    const baseCardH    = rawCardH - Math.ceil(headerToCardsPadding / count)
    const logoSize     = Math.round((count === 1 ? 150 : count === 2 ? 120 : count === 3 ?  90 :  75) * vMult)
    const nameFontSize = Math.round((count === 1 ?  28 : count === 2 ?  24 : count === 3 ?  20 :  17) * vMult)
    const vsFontSize   = Math.round((count === 1 ?  58 : count === 2 ?  48 : count === 3 ?  40 :  34) * vMult)

    // When the user scales title/subtitle/logo beyond 100%, the header box
    // would overflow into the first match card. Grow headerH by the extra
    // pixels each scaled element needs, and steal that growth from each
    // card so the total still fits in the fixed format height.
    const baseHeaderH       = Math.round((count === 1 ? 280 : count === 2 ? 260 : count === 3 ? 240 : 210) * vMult)
    const titleBaseFontSize = Math.round((count === 1 ? 72 : 60) * vMult)
    const subtitleBaseFont  = Math.round(22 * vMult)
    const logoBaseSize      = Math.round((count === 1 ? 110 : 90) * vMult)
    const extraTitle = titulo ? Math.max(0, Math.round(titleBaseFontSize * (titleSize - 1))) : 0
    const extraSubtitle = subtitulo ? Math.max(0, Math.round(subtitleBaseFont * (subtitleSize - 1))) : 0
    const extraLogo = logoUrl ? Math.max(0, Math.round(logoBaseSize * (logoScale - 1))) : 0
    const extraHeader = extraTitle + extraSubtitle + extraLogo
    const headerH = baseHeaderH + extraHeader
    const cardH = Math.max(160, baseCardH - Math.ceil(extraHeader / count))
    const gapBetweenCards = Math.round((count === 1 ? 0 : count <= 3 ? 20 : 16) * vMult)

    return new ImageResponse(
      (
        <div style={{
          width: W, height: H,
          background: themeBg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Fondo propio (imagen al 100%, reemplaza gradiente) */}
          {bgImageUrl ? (
            <img
              src={bgImageUrl}
              width={W} height={H}
              style={{
                position: "absolute", top: 0, left: 0,
                width: W, height: H,
                objectFit: bgFit,
                display: "flex",
              }}
              alt=""
            />
          ) : null}

          {/* Texture overlay */}
          {textureUrl && !bgImageUrl ? (
            <img
              src={textureUrl}
              width={W} height={H}
              style={{
                position: "absolute", top: 0, left: 0,
                width: W, height: H,
                objectFit: "cover",
                opacity: textureOpacity / 100,
                display: "flex",
              }}
              alt=""
            />
          ) : null}

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
                width={Math.round(logoBaseSize * logoScale)}
                height={Math.round(logoBaseSize * logoScale)}
                style={{ objectFit: "contain", marginBottom: 14 }}
                alt="Logo"
              />
            ) : null}

            {/* Subtítulo del usuario (si lo puso) */}
            {subtitulo ? (
              <span style={{
                color: tc.subtitle, fontSize: Math.round(subtitleBaseFont * subtitleSize), fontWeight: 600,
                letterSpacing: 4, marginBottom: 10, textAlign: "center",
              }}>
                {subtitulo.toUpperCase()}
              </span>
            ) : null}

            {/* Título principal */}
            {titulo ? (
              <span style={{
                color: tc.title, fontSize: Math.round(titleBaseFontSize * titleSize), fontWeight: titleWeight,
                letterSpacing: -1, textAlign: "center", lineHeight: 1,
              }}>
                {titulo.toUpperCase()}
              </span>
            ) : (
              <span style={{ color: tc.title, fontSize: Math.round(48 * vMult * titleSize), fontWeight: titleWeight, letterSpacing: 2 }}>
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
            // Breathing room entre el header y la primera tarjeta (ya
            // descontado del cardH vía baseCardH).
            paddingTop: headerToCardsPadding,
          }}>
            {matchDataList.map((match, i) => {
              const cardBg = cardStyle === "solid" ? "rgba(0,0,0,0.45)" : cardStyle === "minimal" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)"
              const cardBorder = cardStyle === "solid" ? "none" : cardStyle === "minimal" ? "1.5px solid rgba(255,255,255,0.07)" : "1.5px solid rgba(255,255,255,0.14)"
              return layout === "compact" ? (
                <MatchCardCompact key={i} match={match} isResultado={isResultado} cardW={cardW} cardH={cardH} tc={tc} cardBg={cardBg} cardBorder={cardBorder} />
              ) : (
                <MatchCard key={i} match={match} isResultado={isResultado} cardW={cardW} cardH={cardH} logoSize={logoSize} nameFontSize={nameFontSize} vsFontSize={vsFontSize} cardStyle={cardStyle} tc={tc} />
              )
            })}
          </div>

          {/* ── FOOTER / SPONSORS ── */}
          {sponsorLogos.length > 0 ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", height: Math.round(130 * vMult),
              background: sponsorBg === "white" ? "rgba(255,255,255,0.97)" : "rgba(0,0,0,0.6)",
              gap: Math.round(56 * vMult), padding: "0 60px",
            }}>
              {sponsorLogos.map((s, i) => {
                const baseH = Math.round(70 * vMult)
                const h = Math.round(baseH * s.scale)
                const maxW = Math.round(220 * vMult * s.scale)
                return (
                  <img
                    key={i}
                    src={s.url}
                    width={maxW}
                    height={h}
                    style={{ objectFit: "contain", flex: "0 0 auto" }}
                    alt={`Sponsor ${i + 1}`}
                  />
                )
              })}
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 60, width: "100%",
            }}>
              <span style={{ color: tc.default, fontSize: 18, fontWeight: 500, letterSpacing: 2 }}>
                cpb.com.py
              </span>
            </div>
          )}
        </div>
      ),
      { width: W, height: H, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
    )
  } catch (e: any) {
    return new Response(e.message ?? "Error generando flyer", { status: 500 })
  }
}
