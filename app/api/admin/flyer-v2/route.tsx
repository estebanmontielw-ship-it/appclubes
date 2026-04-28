import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import {
  resolveLnbCompetitionIdPublic,
  resolveLnbfCompetitionIdPublic,
  resolveU22MCompetitionIdPublic,
  resolveU22FCompetitionIdPublic,
} from "@/lib/programacion-lnb"
import { LNBF } from "@/lib/themes/lnbf"
import { LNBFBackground } from "@/lib/flyer/lnbf-backgrounds"
import { LNB } from "@/lib/themes/lnb"
import { LNBBackground } from "@/lib/flyer/lnb-backgrounds"
import { U22M } from "@/lib/themes/u22m"
import { U22F } from "@/lib/themes/u22f"
import { U22MBackground, U22FBackground, type U22Variant } from "@/lib/flyer/u22-backgrounds"
import { geniusFetch, getLeadersFromMatches } from "@/lib/genius-sports"
import { normalizeStandings } from "@/lib/normalize-standings"
import { computeStandingsFromMatches, loadScheduleByLiga } from "@/lib/programacion-lnb"

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
// MatchCardCompact — versión compact adaptada a la línea premium.
// Mismo concepto que MatchCardLNBF (gradient + hairline gold + palette)
// pero con layout horizontal: equipos apilados a la izquierda, score/hora
// grande a la derecha separado por un border vertical gold.
function MatchCardCompact({ match, isResultado, cardW, cardH, palette }: {
  match: MatchData
  isResultado: boolean
  cardW: number
  cardH: number
  palette: PremiumPalette
}) {
  const hs = parseInt(match.homeScore ?? "")
  const as_ = parseInt(match.awayScore ?? "")
  const tied = isNaN(hs) || isNaN(as_) || hs === as_
  const homeWins = !tied && hs > as_
  const logoSz = Math.round(cardH * 0.30)
  const teamFontSize = Math.max(18, Math.min(32, Math.round(cardH * 0.13)))
  const timeFontSize = Math.round(cardH * 0.38)
  const scoreFontSize = Math.round(cardH * 0.36)
  const metaFontSize = Math.max(12, Math.round(cardH * 0.085))
  const hasMeta = !!(match.date || match.venue)

  return (
    <div style={{
      width: cardW, height: cardH,
      background: `linear-gradient(155deg, ${palette.cardBgStart} 0%, ${palette.cardBgMid} 65%, ${palette.cardBgEnd} 100%)`,
      borderRadius: 20,
      border: `1.5px solid ${palette.borderColor}${palette.borderAlpha}`,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Gold hairline arriba */}
      <div style={{
        position: "absolute", top: 0, left: 24, right: 24, height: 2,
        background: `linear-gradient(90deg, transparent, ${palette.gold}88, transparent)`,
        display: "flex",
      }} />
      {/* Textura sutil radial gold */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: Math.round(cardW * 0.4), height: Math.round(cardH * 0.7),
        background: `radial-gradient(circle at 18% 25%, ${palette.gold}1F 0%, transparent 55%)`,
        display: "flex", pointerEvents: "none",
      }} />

      {/* Main row: teams (left) + time/score (right) */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", width: "100%" }}>
        {/* Teams column — home row + away row */}
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 10, padding: "14px 22px", minWidth: 0 }}>
          {/* Home */}
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Logo url={match.homeLogo} name={match.homeName} size={logoSz} />
            <span style={{
              marginLeft: 16,
              color: "white",
              fontFamily: "Archivo Black",
              fontSize: teamFontSize,
              fontWeight: 900,
              letterSpacing: -0.3,
              display: "flex",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}>
              {match.homeName.toUpperCase()}
            </span>
          </div>
          {/* Away */}
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Logo url={match.awayLogo} name={match.awayName} size={logoSz} />
            <span style={{
              marginLeft: 16,
              color: "white",
              fontFamily: "Archivo Black",
              fontSize: teamFontSize,
              fontWeight: 900,
              letterSpacing: -0.3,
              display: "flex",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}>
              {match.awayName.toUpperCase()}
            </span>
          </div>
        </div>
        {/* Divider gold + Time/Score */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          paddingLeft: 22, paddingRight: 28,
          borderLeft: `1px solid ${palette.gold}55`,
          minWidth: Math.round(cardW * 0.30),
          alignSelf: "stretch",
        }}>
          {isResultado && match.homeScore != null ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ color: "white", fontFamily: "Archivo Black", fontSize: scoreFontSize, fontWeight: 900, lineHeight: 1, letterSpacing: -1.5, display: "flex" }}>{match.homeScore}</span>
              <span style={{ color: palette.gold, fontSize: Math.round(scoreFontSize * 0.5), fontWeight: 700, display: "flex" }}>-</span>
              <span style={{ color: "white", fontFamily: "Archivo Black", fontSize: scoreFontSize, fontWeight: 900, lineHeight: 1, letterSpacing: -1.5, display: "flex" }}>{match.awayScore}</span>
            </div>
          ) : (
            <span style={{ color: "white", fontFamily: "Archivo Black", fontSize: timeFontSize, fontWeight: 900, lineHeight: 1, letterSpacing: -1, display: "flex" }}>
              {match.time || "—"}
            </span>
          )}
          {!isResultado && match.time ? (
            <span style={{ marginTop: 6, color: palette.gold, fontFamily: "Inter", fontSize: Math.max(10, Math.round(timeFontSize * 0.28)), fontWeight: 800, letterSpacing: 2, display: "flex" }}>
              HS
            </span>
          ) : null}
        </div>
      </div>

      {/* Bottom meta strip: fecha · venue con accent dot gold */}
      {hasMeta && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "9px 18px",
          borderTop: `1px solid ${palette.separator}`,
          background: "rgba(3,8,26,0.35)",
          width: "100%",
        }}>
          {match.date ? (
            <span style={{ color: palette.accentSoft, fontFamily: "Inter", fontSize: metaFontSize, fontWeight: 700, letterSpacing: 1.2, display: "flex" }}>
              {match.date.toUpperCase()}
            </span>
          ) : null}
          {match.date && match.venue ? (
            <span style={{ marginLeft: 10, marginRight: 10, color: palette.gold, fontSize: metaFontSize, display: "flex" }}>·</span>
          ) : null}
          {match.venue ? (
            <span style={{ color: "rgba(255,255,255,0.75)", fontFamily: "Inter", fontSize: metaFontSize, fontWeight: 500, display: "flex", overflow: "hidden", whiteSpace: "nowrap" }}>
              {match.venue}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Tarjeta de partido para el tema LNBF Premium — diseño editorial
// con badge "JUEGO N", VS en gold, franja de estadio + fecha y barra
// destacada de horario violeta.
type PremiumPalette = {
  // Card base: gradient diagonal editorial. Tres stops — start / mid / end
  // para dar profundidad, tal como los flyers oficiales LNB/LNBF.
  cardBgStart: string
  cardBgMid: string
  cardBgEnd: string
  borderColor: string   // rgb/hex para el borde principal
  borderAlpha: string   // hex alpha suffix para el borde (ej. "33")
  separator: string     // borde interno top del meta strip
  gold: string          // color de VS + línea accent + dot del badge + hairline
  accentSoft: string    // badge label, eyebrow, ESTADIO label, HORARIO label
  bar1: string          // gradient start de la barra HORARIO
  bar2: string          // gradient end de la barra HORARIO
}

// Paleta LNBF default (morado + gold)
const PALETTE_LNBF: PremiumPalette = {
  cardBgStart: "rgba(60,19,112,0.50)",
  cardBgMid:   "rgba(43,14,77,0.68)",
  cardBgEnd:   "rgba(14,4,24,0.78)",
  borderColor: LNBF.color.violet400,
  borderAlpha: "33",
  separator: "rgba(201,160,255,0.14)",
  gold: LNBF.color.gold500,
  accentSoft: LNBF.color.violet300,
  bar1: LNBF.color.violet700,
  bar2: LNBF.color.violet800,
}

// Paleta LNB (navy + gold)
const PALETTE_LNB: PremiumPalette = {
  cardBgStart: "rgba(30,60,140,0.48)",
  cardBgMid:   "rgba(14,29,79,0.70)",
  cardBgEnd:   "rgba(8,18,51,0.78)",
  borderColor: LNB.color.blue400,
  borderAlpha: "33",
  separator: "rgba(166,190,255,0.18)",
  gold: LNB.color.gold500,
  accentSoft: LNB.color.softBlue,
  bar1: LNB.color.navy700,
  bar2: LNB.color.navy800,
}

// Paleta U22 Masculino (azul Paraguay + rojo). Reutiliza la forma de
// PremiumPalette, pero "gold" ahora es el rojo Paraguay (acento real
// del país) y accentSoft es paper claro.
const PALETTE_U22M: PremiumPalette = {
  cardBgStart: "rgba(30,51,153,0.48)",
  cardBgMid:   "rgba(15,26,72,0.72)",
  cardBgEnd:   "rgba(10,18,48,0.80)",
  borderColor: U22M.color.blue400,
  borderAlpha: "33",
  separator: "rgba(168,188,245,0.18)",
  gold: U22M.color.red600,
  accentSoft: U22M.color.paper200,
  bar1: U22M.color.blue700,
  bar2: U22M.color.blue900,
}

// Paleta U22 Femenino (azul Paraguay + rojo, con rosa sutil en eyebrows).
// Idéntica a U22M salvo accentSoft (rosa --f-accent-soft) y separator
// con un toque rosa para diferenciar género de forma muy sutil.
const PALETTE_U22F: PremiumPalette = {
  cardBgStart: "rgba(30,51,153,0.46)",
  cardBgMid:   "rgba(15,26,72,0.72)",
  cardBgEnd:   "rgba(10,18,48,0.80)",
  borderColor: U22F.color.blue400,
  borderAlpha: "33",
  separator: "rgba(244,168,214,0.20)",
  gold: U22F.color.red600,
  accentSoft: U22F.color.fAccentSoftDim,
  bar1: U22F.color.blue700,
  bar2: U22F.color.blue900,
}

function MatchCardLNBF({ match, matchNumber, isResultado, cardW, cardH, logoSize, vsFontSize, nameFontSize, showHorarioBar, palette = PALETTE_LNBF }: {
  match: MatchData
  matchNumber: number
  isResultado: boolean
  cardW: number
  cardH: number
  logoSize: number
  vsFontSize: number
  nameFontSize: number
  showHorarioBar: boolean
  palette?: PremiumPalette
}) {
  const hs = parseInt(match.homeScore ?? "")
  const as_ = parseInt(match.awayScore ?? "")
  const tied = isNaN(hs) || isNaN(as_) || hs === as_
  const homeWins = !tied && hs > as_
  const badge = `JUEGO ${String(matchNumber).padStart(2, "0")}`
  const badgeFont = Math.max(12, Math.round(cardH * 0.038))
  const metaFont = Math.max(14, Math.round(cardH * 0.048))
  const metaLabelFont = Math.max(11, Math.round(cardH * 0.038))
  const horarioH = Math.max(44, Math.round(cardH * 0.14))
  const horarioFont = Math.max(24, Math.round(cardH * 0.105))
  // Jerarquía de nombres: un pelín más grande que el default
  const teamFs = Math.round(nameFontSize * 1.08)
  // VS más prominente cuando hay espacio (usa Archivo Black para extra peso)
  const vsFs = Math.round(vsFontSize * 1.05)

  return (
    <div style={{
      width: cardW, height: cardH,
      background: `linear-gradient(155deg, ${palette.cardBgStart} 0%, ${palette.cardBgMid} 65%, ${palette.cardBgEnd} 100%)`,
      borderRadius: 20,
      border: `1.5px solid ${palette.borderColor}${palette.borderAlpha}`,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Gold hairline arriba — elemento de diseño editorial LNB/LNBF */}
      <div style={{
        position: "absolute", top: 0, left: 24, right: 24, height: 2,
        background: `linear-gradient(90deg, transparent, ${palette.gold}88, transparent)`,
        display: "flex",
      }} />
      {/* Textura sutil interna — radial gold en la esquina top-left para
          dar profundidad "poster oficial". Satori soporta radial-gradient
          circle (ellipse a veces falla). */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: Math.round(cardW * 0.35), height: Math.round(cardH * 0.6),
        background: `radial-gradient(circle at 18% 22%, ${palette.gold}2E 0%, transparent 58%)`,
        display: "flex", pointerEvents: "none",
      }} />
      {/* JUEGO 0X badge con punto sutil */}
      <div style={{
        position: "absolute", top: 14, left: 20,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", width: 6, height: 6, borderRadius: 3, background: palette.gold }} />
        <span style={{
          fontFamily: "Inter", fontSize: badgeFont,
          fontWeight: 800, letterSpacing: 2.5,
          color: palette.accentSoft, display: "flex",
        }}>
          {badge}
        </span>
      </div>

      {/* Fila principal: Home · VS · Away */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", width: "100%", paddingTop: Math.round(cardH * 0.14) }}>
        {/* Home */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 16 }}>
          <Logo url={match.homeLogo} name={match.homeName} size={logoSize} />
          <span style={{ color: "white", fontFamily: "Archivo Black", fontSize: teamFs, fontWeight: 900, letterSpacing: -0.5, textAlign: "center", maxWidth: cardW * 0.35, display: "flex", lineHeight: 1.05 }}>
            {match.homeName.toUpperCase()}
          </span>
        </div>
        {/* VS / score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 120 }}>
          {isResultado && match.homeScore != null ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ color: "white", fontFamily: "Archivo Black", fontSize: vsFs * 1.3, fontWeight: 900, lineHeight: 1, letterSpacing: -2, display: "flex" }}>{match.homeScore}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: Math.round(vsFs * 0.55), fontWeight: 700, display: "flex" }}>-</span>
              <span style={{ color: "white", fontFamily: "Archivo Black", fontSize: vsFs * 1.3, fontWeight: 900, lineHeight: 1, letterSpacing: -2, display: "flex" }}>{match.awayScore}</span>
            </div>
          ) : (
            <span style={{ color: palette.gold, fontFamily: "Archivo Black", fontSize: vsFs, fontWeight: 900, letterSpacing: 2, display: "flex", lineHeight: 1 }}>
              VS
            </span>
          )}
          {/* Accent line under VS */}
          <div style={{ width: 38, height: 3, background: palette.gold, marginTop: 8, borderRadius: 2, display: "flex" }} />
        </div>
        {/* Away */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 16 }}>
          <Logo url={match.awayLogo} name={match.awayName} size={logoSize} />
          <span style={{ color: "white", fontFamily: "Archivo Black", fontSize: teamFs, fontWeight: 900, letterSpacing: -0.5, textAlign: "center", maxWidth: cardW * 0.35, display: "flex", lineHeight: 1.05 }}>
            {match.awayName.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Meta info — 3 columnas con iconos + dividers verticales, estilo
          del handoff oficial LNB (ProxV1 refined). Cada columna tiene un
          icono SVG inline (dorado) + label chiquito + valor grande. Las
          dividers son <div> con width 1px y height fijo. */}
      <div style={{
        display: "flex", alignItems: "center",
        margin: "10px 18px 0",
        padding: "12px 14px",
        background: "rgba(3,8,26,0.55)",
        borderRadius: 12,
        border: `1px solid ${palette.separator}`,
        width: "auto",
      }}>
        {/* ESTADIO */}
        <div style={{ display: "flex", alignItems: "center", flex: 1.7, minWidth: 0, paddingLeft: 6 }}>
          <svg width={metaFont + 4} height={metaFont + 4} viewBox="0 0 24 24" style={{ display: "flex", flexShrink: 0 }}>
            <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" stroke={palette.gold} strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            <circle cx="12" cy="9" r="2.2" stroke={palette.gold} strokeWidth="1.8" fill="none"/>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 10, minWidth: 0 }}>
            <span style={{ color: palette.accentSoft, fontFamily: "Inter", fontSize: metaLabelFont * 0.85, fontWeight: 800, letterSpacing: 2.5, lineHeight: 1, display: "flex" }}>ESTADIO</span>
            <span style={{ marginTop: 3, color: "white", fontFamily: "Inter", fontSize: metaFont, fontWeight: 700, lineHeight: 1.15, display: "flex" }}>{match.venue || "—"}</span>
          </div>
        </div>
        <div style={{ display: "flex", width: 1, height: 32, background: palette.separator }} />
        {/* FECHA */}
        <div style={{ display: "flex", alignItems: "center", flex: 1, paddingLeft: 14 }}>
          <svg width={metaFont + 4} height={metaFont + 4} viewBox="0 0 24 24" style={{ display: "flex", flexShrink: 0 }}>
            <rect x="3.5" y="5.5" width="17" height="15" rx="2" stroke={palette.gold} strokeWidth="1.8" fill="none"/>
            <path d="M3.5 10h17M8 3v4M16 3v4" stroke={palette.gold} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 10 }}>
            <span style={{ color: palette.accentSoft, fontFamily: "Inter", fontSize: metaLabelFont * 0.85, fontWeight: 800, letterSpacing: 2.5, lineHeight: 1, display: "flex" }}>FECHA</span>
            <span style={{ marginTop: 3, color: "white", fontFamily: "Inter", fontSize: metaFont, fontWeight: 700, lineHeight: 1.15, letterSpacing: 0.5, display: "flex" }}>{(match.date || "—").toUpperCase()}</span>
          </div>
        </div>
        <div style={{ display: "flex", width: 1, height: 32, background: palette.separator }} />
        {/* HORA */}
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 14, paddingRight: 6 }}>
          <svg width={metaFont + 4} height={metaFont + 4} viewBox="0 0 24 24" style={{ display: "flex", flexShrink: 0 }}>
            <circle cx="12" cy="12" r="8.5" stroke={palette.gold} strokeWidth="1.8" fill="none"/>
            <path d="M12 7.5V12l3 2" stroke={palette.gold} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 10 }}>
            <span style={{ color: palette.accentSoft, fontFamily: "Inter", fontSize: metaLabelFont * 0.85, fontWeight: 800, letterSpacing: 2.5, lineHeight: 1, display: "flex" }}>HORA</span>
            <span style={{ marginTop: 2, color: "white", fontFamily: "Archivo Black", fontSize: Math.round(metaFont * 1.25), lineHeight: 1, letterSpacing: -0.5, display: "flex" }}>{match.time || "—"}<span style={{ marginLeft: 4, fontFamily: "Inter", fontSize: Math.round(metaFont * 0.7), color: palette.gold, letterSpacing: 1, display: "flex" }}>HS</span></span>
          </div>
        </div>
      </div>

      {/* Barra HORARIO (o RESULTADO) — opcional */}
      {showHorarioBar && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: horarioH,
          padding: "0 22px",
          background: `linear-gradient(90deg, ${palette.bar1} 0%, ${palette.bar2} 100%)`,
          width: "100%",
        }}>
          <span style={{ color: palette.accentSoft, fontFamily: "Inter", fontSize: Math.max(12, Math.round(horarioFont * 0.5)), fontWeight: 700, letterSpacing: 3, display: "flex" }}>
            {isResultado ? "RESULTADO" : "HORARIO"}
          </span>
          <span style={{ color: "white", fontFamily: "Archivo Black", fontSize: horarioFont, fontWeight: 900, letterSpacing: -0.5, display: "flex" }}>
            {isResultado && match.homeScore != null
              ? `${match.homeScore} - ${match.awayScore}`
              : `${match.time || "—"} HS`}
          </span>
        </div>
      )}
    </div>
  )
}
// Se usan dentro de ImageResponse({ fonts: [...] }) para que satori
// pueda renderizar con tipografías específicas. Si las fonts no
// existen el intento falla silenciosamente y satori cae al default
// sans-serif — así el V2 nunca se rompe por falta de archivo.
let cachedFonts: { name: string; data: ArrayBuffer; weight: 400 | 700 | 900; style?: "normal" }[] | null = null

async function loadFonts() {
  if (cachedFonts) return cachedFonts
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"
  const fetchFont = async (path: string): Promise<ArrayBuffer | null> => {
    try {
      const res = await fetch(`${baseUrl}${path}`, { cache: "force-cache" })
      if (!res.ok) return null
      return await res.arrayBuffer()
    } catch { return null }
  }
  const [archivoBlack, bebasNeue, interRegular, interBold, interBlack] = await Promise.all([
    fetchFont("/fonts/ArchivoBlack-Regular.ttf"),
    fetchFont("/fonts/BebasNeue-Regular.ttf"),
    fetchFont("/fonts/Inter-Regular.ttf"),
    fetchFont("/fonts/Inter-Bold.ttf"),
    fetchFont("/fonts/Inter-Black.ttf"),
  ])
  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 700 | 900; style?: "normal" }[] = []
  if (archivoBlack)  fonts.push({ name: "Archivo Black", data: archivoBlack, weight: 900, style: "normal" })
  if (bebasNeue)     fonts.push({ name: "Bebas Neue",    data: bebasNeue,    weight: 700, style: "normal" })
  if (interRegular)  fonts.push({ name: "Inter",         data: interRegular, weight: 400, style: "normal" })
  if (interBold)     fonts.push({ name: "Inter",         data: interBold,    weight: 700, style: "normal" })
  if (interBlack)    fonts.push({ name: "Inter",         data: interBlack,   weight: 900, style: "normal" })
  cachedFonts = fonts
  return fonts
}

// Materializa el ImageResponse antes de retornar al cliente: consume el
// stream de satori sincrónicamente. Si satori falla, el error revienta
// adentro del `try/catch` del handler en lugar de morir mid-stream
// (que es cuando Next devuelve la HTML genérica de 500 que bypasea
// nuestro `e.message`). Con esto cualquier "Cannot read properties of
// undefined" llega al cliente como texto plano y queda visible en logs.
async function renderImage(
  jsx: ConstructorParameters<typeof ImageResponse>[0],
  options: ConstructorParameters<typeof ImageResponse>[1],
): Promise<Response> {
  const imgResp = new ImageResponse(jsx, options)
  const buf = await imgResp.arrayBuffer()
  const headers = new Headers(imgResp.headers)
  if (!headers.has("content-type")) headers.set("content-type", "image/png")
  return new Response(buf, { status: 200, headers })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const fonts = await loadFonts()
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
  const isTabla       = template === "tabla"
  const isLideres     = template === "lideres"
  const isJugador     = template === "jugador"
  const isLanzamiento = template === "lanzamiento"
  const isNoticia     = template === "noticia"
  const statType   = (searchParams.get("statType") ?? "scoring") as "scoring" | "assists" | "rebounds"
  const playerPhotoUrl = searchParams.get("playerPhoto") ?? ""
  const jugadorNombre  = searchParams.get("jugadorNombre") ?? ""
  const jugadorClub    = searchParams.get("jugadorClub") ?? ""
  const jugadorPremio  = searchParams.get("jugadorPremio") ?? "BROU"
  const jugadorFecha   = searchParams.get("jugadorFecha") ?? ""
  const jugadorTeamLogo = searchParams.get("jugadorTeamLogo") ?? ""
  // Noticia — categoría, fecha y URL opcionales. Título/subtítulo y fondo
  // reutilizan los inputs globales.
  const noticiaCategoria = (searchParams.get("noticiaCategoria") ?? "NOTICIA").trim()
  const noticiaFecha     = (searchParams.get("noticiaFecha") ?? "").trim()
  const noticiaUrl       = (searchParams.get("noticiaUrl") ?? "").trim()

  // Encuadre de imágenes (cover = llena y recorta, contain = ve todo con márgenes)
  const bgFit = (searchParams.get("bgFit") ?? "cover") as "cover" | "contain"
  const photoFit = (searchParams.get("photoFit") ?? "cover") as "cover" | "contain"
  // Safe zones de Instagram Stories: cuando está activo, deja ~240px
  // arriba y ~280px abajo para evitar que el username/música tape el
  // título o que las reactions/Activity tape los sponsors.
  const safeZones = searchParams.get("safeZones") === "true"
  // Patrón del fondo para tema lnbf-premium: "clean" (solo glows),
  // "dots" (constelación dorada), "nandu" (rombos ñandutí), "court"
  // (líneas de cancha). Default "dots" porque da más textura sin
  // distraer. Aplica solo cuando theme === "lnbf-premium".
  const lnbfPatternRaw = searchParams.get("lnbfPattern") ?? "dots"
  const lnbfPattern = (["clean", "dots", "nandu", "court"].includes(lnbfPatternRaw)
    ? lnbfPatternRaw
    : "dots") as "clean" | "dots" | "nandu" | "court"
  // Patrón de fondo para tema lnb-premium: clean / scratch / dots /
  // court / halftone / speed. Default scratch (estilo oficial LNB).
  const lnbPatternRaw = searchParams.get("lnbPattern") ?? "scratch"
  const lnbPattern = (["clean", "scratch", "dots", "court", "halftone", "speed"].includes(lnbPatternRaw)
    ? lnbPatternRaw
    : "scratch") as "clean" | "scratch" | "dots" | "court" | "halftone" | "speed"
  // Patrón de fondo para temas u22*-premium: clean / dots / stripes /
  // court / bandera / paper. Default "clean" — bandera + paper son
  // opt-in porque rendericen sobre todo el flyer (modo "fondo
  // alternativo Paraguay") y satori a veces tiene problemas con sus
  // clip-paths.
  const u22PatternRaw = searchParams.get("u22Pattern") ?? "clean"
  const u22Pattern = (["clean", "dots", "stripes", "court", "bandera", "paper"].includes(u22PatternRaw)
    ? u22PatternRaw
    : "clean") as U22Variant
  // Badge arriba derecha en tema lnbf-premium (ej. "FECHA 1"). Si viene
  // vacío no se renderiza el pill.
  const lnbfBadge = (searchParams.get("lnbfBadge") ?? "").trim()
  // Mostrar u ocultar la barra HORARIO al pie de cada tarjeta premium.
  // Default OFF — el info row ya muestra HORA con icono, la barra
  // se vuelve redundante. Se activa sólo si el usuario lo pide por URL.
  const lnbfShowHorarioBar = searchParams.get("lnbfShowHorarioBar") === "true"
  // Mostrar u ocultar la franja de sponsors. Cuando es false, los logos
  // de sponsors igual se renderizan pero sin fondo — flotan sobre el canvas.
  const showSponsorBar = searchParams.get("showSponsorBar") !== "false"
  // Layout del header en temas premium: "split" (logo izq + badge der,
  // default) o "centered" (logo centrado arriba, estilo V1 LNB oficial).
  const premiumHeaderLayout = (searchParams.get("premiumHeaderLayout") === "centered" ? "centered" : "split") as "split" | "centered"
  // Filter + opacity que blanquea los sponsors en temas premium (lnbf
  // o lnb) para que queden unificados sobre el fondo oscuro. Satori
  // soporta brightness + invert individualmente (no todos los filtros).
  const isPremiumTheme = theme === "lnbf-premium" || theme === "lnb-premium" || theme === "u22m-premium" || theme === "u22f-premium"
  const sponsorFilter = isPremiumTheme ? "brightness(0) invert(1)" : undefined
  const sponsorOpacity = isPremiumTheme ? 0.85 : 1
  // Fondo de la barra de sponsors: en temas premium forzamos un tono
  // oscuro translúcido (que combina con el canvas); en los demás temas
  // respetamos la elección del usuario (white/dark).
  const premiumSponsorBarBg =
    theme === "lnb-premium"   ? "rgba(3,8,26,0.78)"   // navy deep
  : theme === "u22m-premium"  ? "rgba(10,18,48,0.78)" // azul Paraguay deep
  : theme === "u22f-premium"  ? "rgba(10,18,48,0.78)" // azul Paraguay deep
                              : "rgba(14,4,24,0.75)"  // violet deep (lnbf default)
  const isStorySafe = (fmt: string) => fmt === "historia" && safeZones
  const safeTopFor = (fmt: string) => isStorySafe(fmt) ? 240 : 0
  const safeBottomFor = (fmt: string) => isStorySafe(fmt) ? 280 : 0
  // Control de foto del jugador: posición X/Y del crop + zoom.
  // Defaults: X=50 (centro horizontal), Y=0 (arriba — la cara suele
  // estar en la parte superior), zoom=100 (sin zoom).
  const photoPosX  = Math.max(0, Math.min(100, parseInt(searchParams.get("photoPosX") ?? "50", 10)))
  const photoPosY  = Math.max(0, Math.min(100, parseInt(searchParams.get("photoPosY") ?? "0", 10)))
  const photoScale = Math.max(50, Math.min(300, parseInt(searchParams.get("photoScale") ?? "100", 10))) / 100

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
  if (matchIds.length === 0 && !isTabla && !isLideres && !isJugador && !isLanzamiento && !isNoticia) return new Response("matchIds requerido", { status: 400 })

  const isResultado = template === "resultado"

  // Shared theme gradient
  const THEME_BG: Record<string, string> = {
    masc1: "linear-gradient(160deg, #0b1e3d 0%, #0d2550 50%, #091830 100%)",
    masc2: "linear-gradient(160deg, #0a2e6e 0%, #0c3a8a 50%, #061a4a 100%)",
    fem1:  "linear-gradient(160deg, #2d0a4e 0%, #3d1260 50%, #1a0630 100%)",
    fem2:  "linear-gradient(160deg, #4a0a1a 0%, #5c1020 50%, #2a0610 100%)",
    // Tema premium para LNBF — morado profundo + gold accent. Ver
    // lib/themes/lnbf.ts para tokens completos.
    "lnbf-premium": LNBF.bgHero,
    // Tema premium para LNB Masculino — navy + gold. Ver lib/themes/lnb.ts.
    "lnb-premium": LNB.bgHero,
    // Temas premium U22 (Sub 22 Masc/Fem) — azul Paraguay + rojo. Ver
    // lib/themes/u22m.ts y u22f.ts. El bg base es idéntico (paleta país)
    // y el accent femenino aparece sólo en eyebrows/chips de las cards.
    "u22m-premium": U22M.bgHero,
    "u22f-premium": U22F.bgHero,
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

    // ── LANZAMIENTO DE TEMPORADA ──
    // Flyer estático de arranque: título hero ("APERTURA 2026"), fecha +
    // hora opcionales, grilla de logos de todos los equipos y sponsors.
    // Los datos de equipos se obtienen del endpoint de standings (aunque
    // la liga recién empiece, la config de equipos ya existe).
    if (isLanzamiento) {
      const standingsRaw = await geniusFetch(`/competitions/${compId}/standings`, "short")
      const teams = normalizeStandings(standingsRaw)
      if (teams.length === 0) return new Response("No hay equipos para el lanzamiento", { status: 404 })

      const lzFecha = searchParams.get("lzFecha") ?? ""
      const lzHora = searchParams.get("lzHora") ?? ""
      const tituloFinal = titulo || "APERTURA 2026"
      const H = format === "historia" ? 1920 : 1350
      const vMult = format === "historia" ? (safeZones ? 1.0 : 1.4) : 1.0

      const footerH = sponsorLogos.length > 0 ? Math.round(130 * vMult) : Math.round(60 * vMult)
      // Grilla de logos: 4 por fila. Calcula tamaño para que quepan con
      // gaps razonables dentro del ancho disponible.
      const perRow = teams.length <= 4 ? teams.length : teams.length <= 9 ? 3 : 4
      const gap = Math.round(24 * vMult)
      const horizontalPadding = 80
      const logoTeamSize = Math.min(
        Math.round(200 * vMult),
        Math.floor((W - horizontalPadding * 2 - gap * (perRow - 1)) / perRow)
      )

      return renderImage(
        (
          <div style={{ width: W, height: H, background: themeBg, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: LNBF.font.body, position: "relative", overflow: "hidden", paddingTop: safeTopFor(format), paddingBottom: safeBottomFor(format) }}>
            {bgImageUrl ? <img src={bgImageUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: bgFit, display: "flex" }} alt="" /> : null}
            {textureUrl && !bgImageUrl ? <img src={textureUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover", opacity: textureOpacity / 100, display: "flex" }} alt="" /> : null}
            {!bgImageUrl && theme === "lnbf-premium" ? (
              <LNBFBackground variant={lnbfPattern} W={W} H={H} />
            ) : !bgImageUrl && theme === "lnb-premium" ? (
              <LNBBackground variant={lnbPattern} W={W} H={H} />
            ) : !bgImageUrl && theme === "u22m-premium" ? (
              <U22MBackground variant={u22Pattern} W={W} H={H} />
            ) : !bgImageUrl && theme === "u22f-premium" ? (
              <U22FBackground variant={u22Pattern} W={W} H={H} />
            ) : !bgImageUrl ? (
              <>
                <div style={{ position: "absolute", top: -200, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,80,160,0.35) 0%, transparent 70%)", display: "flex" }} />
                <div style={{ position: "absolute", bottom: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(15,60,120,0.3) 0%, transparent 70%)", display: "flex" }} />
              </>
            ) : null}

            {/* Contenido central */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, width: "100%", paddingTop: Math.round(40 * vMult), paddingLeft: horizontalPadding, paddingRight: horizontalPadding }}>
              {/* Logo liga */}
              {logoUrl ? (
                <img src={logoUrl} width={Math.round(120 * vMult * logoScale)} height={Math.round(120 * vMult * logoScale)} style={{ objectFit: "contain", marginBottom: Math.round(24 * vMult), display: "flex" }} alt="" />
              ) : null}

              {/* Hero title */}
              <span style={{ color: "white", fontSize: Math.round(120 * vMult * titleSize), fontWeight: 900, fontFamily: "Archivo Black", letterSpacing: -4, lineHeight: 0.95, textAlign: "center", marginBottom: Math.round(10 * vMult) }}>
                {tituloFinal.toUpperCase()}
              </span>

              {/* Fecha · Hora */}
              {(lzFecha || lzHora) && (
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: Math.round(8 * vMult), marginBottom: Math.round(44 * vMult) }}>
                  {lzFecha ? <span style={{ color: LNBF.color.gold500, fontFamily: "Bebas Neue", fontSize: Math.round(52 * vMult), letterSpacing: 4, display: "flex" }}>{lzFecha.toUpperCase()}</span> : null}
                  {lzFecha && lzHora ? <span style={{ color: "rgba(255,255,255,0.4)", display: "flex", fontSize: 32 }}>·</span> : null}
                  {lzHora ? <span style={{ color: LNBF.color.gold500, fontFamily: "Bebas Neue", fontSize: Math.round(52 * vMult), letterSpacing: 4, display: "flex" }}>{lzHora} HS</span> : null}
                </div>
              )}

              {/* Eyebrow */}
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: Math.round(18 * vMult), fontWeight: 700, letterSpacing: 4, marginBottom: Math.round(24 * vMult), textAlign: "center", display: "flex" }}>
                EQUIPOS PARTICIPANTES
              </span>

              {/* Grilla de logos */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap, maxWidth: W - horizontalPadding * 2 }}>
                {teams.map((t: any, i: number) => {
                  const normalizedUrl = t.teamLogo
                    ? `${LOGO_NORM_BASE}/api/logo-norm?url=${encodeURIComponent(t.teamLogo)}&size=${Math.round(logoTeamSize * 0.78)}`
                    : ""
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: logoTeamSize, height: logoTeamSize,
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 18,
                      border: `1.5px solid ${theme === "lnbf-premium" ? "rgba(201,160,255,0.22)" : "rgba(255,255,255,0.10)"}`,
                    }}>
                      {normalizedUrl ? (
                        <img src={normalizedUrl} width={Math.round(logoTeamSize * 0.78)} height={Math.round(logoTeamSize * 0.78)} style={{ objectFit: "contain", display: "flex" }} alt={t.teamName} />
                      ) : (
                        <span style={{ color: "white", fontSize: Math.round(logoTeamSize * 0.32), fontWeight: 900, fontFamily: "Archivo Black", display: "flex" }}>
                          {t.teamSigla?.slice(0, 2) ?? "?"}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sponsors footer */}
            {sponsorLogos.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: footerH, background: !showSponsorBar ? "transparent" : isPremiumTheme ? premiumSponsorBarBg : sponsorBg === "white" ? "rgba(255,255,255,0.97)" : "rgba(0,0,0,0.55)", padding: "0 60px", position: "relative" }}>
                {/* Hairline divisor entre cards y sponsors — siempre visible
                    en temas premium, posicionada justo en el borde superior
                    del container (top:0) para estar pegada a la zona de
                    cards, sin importar si la barra tiene fondo o no. */}
                {isPremiumTheme && (
                  <div style={{ display: "flex", position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)" }} />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(56 * vMult), width: "100%", flex: 1 }}>
                  {sponsorLogos.map((s, i) => { const h = Math.round(70 * vMult * s.scale); return <img key={i} src={s.url} width={Math.round(220 * vMult * s.scale)} height={h} style={{ objectFit: "contain", flex: "0 0 auto", filter: sponsorFilter, opacity: sponsorOpacity }} alt={`Sponsor ${i + 1}`} /> })}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: footerH, width: "100%" }}>
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: Math.round(18 * vMult), fontWeight: 500, letterSpacing: 2, display: "flex" }}>cpb.com.py</span>
              </div>
            )}
          </div>
        ),
        { width: W, height: H, fonts, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
      )
    }

    // ── TABLA DE POSICIONES ──
    if (isTabla) {
      // Recalculamos la tabla desde los partidos (ya con scores corregidos
      // via FibaLiveStats fallback). El endpoint /standings de Genius devuelve
      // datos rotos para partidos que terminaron en OT — ver fix 8665fad.
      const { matches, teams: scheduleTeams } = await loadScheduleByLiga(liga)
      const allRows = computeStandingsFromMatches(matches, scheduleTeams)
      if (allRows.length === 0) return new Response("No hay datos de tabla disponibles", { status: 404 })

      const H = format === "historia" ? 1920 : 1350
      const vMult = format === "historia" ? (safeZones ? 1.0 : 1.4) : 1.0
      // Header dinámico: crece si el user escaló título, subtítulo o logo
      // para que nunca se encime con los headers de columna de la tabla.
      const baseHeaderH = Math.round(240 * vMult)
      const titleBaseFS = Math.round(60 * vMult)
      const subtitleBaseFS = Math.round(22 * vMult)
      const logoBaseH = Math.round(90 * vMult)
      const extraTitleH    = titulo ? Math.max(0, Math.round(titleBaseFS * (titleSize - 1))) : 0
      const extraSubtitleH = subtitulo ? Math.max(0, Math.round(subtitleBaseFS * (subtitleSize - 1))) : 0
      const extraLogoH     = logoUrl ? Math.max(0, Math.round(logoBaseH * (logoScale - 1))) : 0
      const headerH = baseHeaderH + extraTitleH + extraSubtitleH + extraLogoH
      const footerH = sponsorLogos.length > 0 ? Math.round(130 * vMult) : Math.round(60 * vMult)
      // Calculamos dinámicamente el alto de cada fila para que la tabla
      // llene todo el espacio disponible del canvas. Antes era fijo en 60px
      // y quedaba un hueco gigante en Historia 9:16. Topamos con un máx
      // razonable (130px) para que con pocas filas no se estire sin sentido
      // ni los textos queden gigantes.
      const rowsCount = allRows.length
      // PJ máximo en la liga — los equipos con menos PJ se muestran en
      // ámbar + negrita para señalar que están abajo por haber jugado
      // menos, no necesariamente por mal rendimiento.
      const maxPJ = Math.max(...allRows.map((r) => r.gamesPlayed))
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
        ? Math.min(110, Math.round(rowH * 0.85))
        : Math.min(60, Math.round(rowH * 0.70))
      const statFontSize   = Math.min(22, Math.round(rowH * 0.30))
      const statSecondary  = Math.min(18, Math.round(rowH * 0.26))
      const colHeaderFont  = Math.round(14 * vMult)
      const tituloFinal = titulo || "TABLA DE POSICIONES"

      return renderImage(
        (
          <div style={{ width: W, height: H, background: themeBg, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "sans-serif", position: "relative", overflow: "hidden", paddingTop: safeTopFor(format), paddingBottom: safeBottomFor(format) }}>
            {bgImageUrl ? <img src={bgImageUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: bgFit, display: "flex" }} alt="" /> : null}
            {textureUrl && !bgImageUrl ? <img src={textureUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover", opacity: textureOpacity / 100, display: "flex" }} alt="" /> : null}
            {!bgImageUrl && theme === "lnbf-premium" ? (
              <LNBFBackground variant={lnbfPattern} W={W} H={H} />
            ) : !bgImageUrl && theme === "lnb-premium" ? (
              <LNBBackground variant={lnbPattern} W={W} H={H} />
            ) : !bgImageUrl && theme === "u22m-premium" ? (
              <U22MBackground variant={u22Pattern} W={W} H={H} />
            ) : !bgImageUrl && theme === "u22f-premium" ? (
              <U22FBackground variant={u22Pattern} W={W} H={H} />
            ) : !bgImageUrl ? (
              <>
                <div style={{ position: "absolute", top: -200, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,80,160,0.35) 0%, transparent 70%)", display: "flex" }} />
                <div style={{ position: "absolute", bottom: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(15,60,120,0.3) 0%, transparent 70%)", display: "flex" }} />
              </>
            ) : null}

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
                  const hasLessGames = row.gamesPlayed < maxPJ
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
                      <div style={{ display: "flex", width: Math.round(58 * vMult), justifyContent: "center" }}><span style={{ color: hasLessGames ? "#fbbf24" : tc.subtitle, fontSize: statFontSize, fontWeight: hasLessGames ? 900 : 400 }}>{row.gamesPlayed}</span></div>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: footerH, background: !showSponsorBar ? "transparent" : isPremiumTheme ? premiumSponsorBarBg : sponsorBg === "white" ? "rgba(255,255,255,0.97)" : "rgba(0,0,0,0.6)", gap: Math.round(56 * vMult), padding: "0 60px" }}>
                {sponsorLogos.map((s, i) => { const h = Math.round(70 * vMult * s.scale); return <img key={i} src={s.url} width={Math.round(220 * vMult * s.scale)} height={h} style={{ objectFit: "contain", flex: "0 0 auto", filter: sponsorFilter, opacity: sponsorOpacity }} alt={`Sponsor ${i + 1}`} /> })}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: footerH, width: "100%" }}>
                <span style={{ color: tc.default, fontSize: Math.round(18 * vMult), fontWeight: 500, letterSpacing: 2 }}>cpb.com.py</span>
              </div>
            )}
          </div>
        ),
        { width: W, height: H, fonts, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
      )
    }

    // ── JUGADOR DEL PARTIDO ──
    if (isJugador) {
      const H = format === "historia" ? 1920 : 1350
      const isFemLiga = liga === "lnbf" || liga === "u22f"
      const jugadorHeading = isFemLiga ? "JUGADORA" : "JUGADOR"
      return renderImage(
        (
          <div style={{ width: W, height: H, display: "flex", fontFamily: "sans-serif", position: "relative", overflow: "hidden", background: themeBg }}>
            {playerPhotoUrl ? (() => {
              const imgW = Math.round(W * photoScale)
              const imgH = Math.round(H * photoScale)
              const offsetX = Math.round((imgW - W) * (photoPosX / 100))
              const offsetY = Math.round((imgH - H) * (photoPosY / 100))
              return (
                <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, overflow: "hidden", display: "flex" }}>
                  <img src={playerPhotoUrl} width={imgW} height={imgH} style={{ position: "absolute", top: -offsetY, left: -offsetX, width: imgW, height: imgH, objectFit: photoFit, objectPosition: `${photoPosX}% ${photoPosY}%`, display: "flex" }} alt={jugadorNombre} />
                </div>
              )
            })() : <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, background: themeBg, display: "flex" }} />}
            {textureUrl ? <img src={textureUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover", opacity: textureOpacity / 100, display: "flex" }} alt="" /> : null}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)", display: "flex" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: Math.round(H * 0.42), background: "linear-gradient(180deg, transparent 0%, rgba(10,20,50,0.92) 30%, rgba(10,20,50,0.98) 100%)", display: "flex" }} />
            {logoUrl ? <img src={logoUrl} width={Math.round(80 * logoScale)} height={Math.round(80 * logoScale)} style={{ position: "absolute", top: 36 + safeTopFor(format), left: 36, objectFit: "contain", display: "flex" }} alt="Logo" /> : null}
            {jugadorTeamLogo ? <img src={jugadorTeamLogo} width={120} height={120} style={{ position: "absolute", top: Math.round(H * 0.38), left: 48, objectFit: "contain", display: "flex" }} alt={jugadorClub} /> : null}
            <div style={{ position: "absolute", bottom: Math.round(H * 0.24) + safeBottomFor(format), left: 48, right: 48, display: "flex", flexDirection: "column" }}>
              <span style={{ color: "white", fontSize: Math.round(80 * titleSize), fontWeight: titleWeight, lineHeight: 0.9, letterSpacing: -3 }}>{jugadorHeading}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 4 }}>
                <span style={{ color: "white", fontSize: Math.round(80 * titleSize), fontWeight: titleWeight, lineHeight: 0.9, letterSpacing: -3 }}>{jugadorPremio.toUpperCase()}</span>
                {jugadorFecha ? <div style={{ display: "flex", background: "rgba(255,255,255,0.15)", borderRadius: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6 }}><span style={{ color: "white", fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>{jugadorFecha.toUpperCase()}</span></div> : null}
              </div>
            </div>
            <div style={{ position: "absolute", bottom: Math.round(H * 0.11) + safeBottomFor(format), left: 48, right: 48, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "white", fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>{jugadorNombre.toUpperCase()}</span>
              {jugadorClub ? <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 20, fontWeight: 600, letterSpacing: 2 }}>{jugadorClub.toUpperCase()}</span> : null}
            </div>
            {sponsorLogos.length > 0 ? (
              <div style={{ position: "absolute", bottom: safeBottomFor(format), left: 0, right: 0, height: 90, background: !showSponsorBar ? "transparent" : isPremiumTheme ? premiumSponsorBarBg : sponsorBg === "white" ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
                {sponsorLogos.map((s, i) => { const h = Math.round(48 * s.scale); return <img key={i} src={s.url} width={Math.round(150 * s.scale)} height={h} style={{ objectFit: "contain", filter: sponsorFilter, opacity: sponsorOpacity }} alt={`Sponsor ${i + 1}`} /> })}
              </div>
            ) : <div style={{ position: "absolute", bottom: 28 + safeBottomFor(format), right: 48, display: "flex" }}><span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, letterSpacing: 2 }}>CPB · cpb.com.py</span></div>}
          </div>
        ),
        { width: W, height: H, fonts, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
      )
    }

    // ── NOTICIA (banner de noticia) ──
    // Hero image (bgImageUrl) + dark gradient + category pill + title +
    // subtitle + fecha + URL opcional. Soporta Feed 4:5, Historia 9:16 y
    // Banner web 1200×628. El tamaño del título se adapta al largo para
    // que titulares cortos y largos queden bien.
    if (isNoticia) {
      const isBanner = format === "banner"
      const noticiaW = isBanner ? 1200 : W
      const noticiaH = isBanner ? 628 : (format === "historia" ? 1920 : 1350)
      const tituloFinal = (titulo && titulo.trim()) || "Título de la noticia"
      const len = tituloFinal.length
      const sizeScale = len > 120 ? 0.55 : len > 80 ? 0.7 : len > 50 ? 0.85 : 1
      const baseTitleSize = isBanner ? 64 : (format === "historia" ? 96 : 88)
      const finalTitleSize = Math.round(baseTitleSize * sizeScale * titleSize)
      const subtitleFinalSize = Math.round((isBanner ? 20 : 28) * subtitleSize)
      const bottomGradientH = isBanner ? Math.round(noticiaH * 0.85) : Math.round(noticiaH * 0.55)
      const catText = (noticiaCategoria || "NOTICIA").toUpperCase()
      const sponsorBarH = isBanner ? 70 : 90
      const showBottomSponsors = sponsorLogos.length > 0 && !isBanner
      return renderImage(
        (
          <div style={{ width: noticiaW, height: noticiaH, display: "flex", fontFamily: "sans-serif", position: "relative", overflow: "hidden", background: themeBg }}>
            {bgImageUrl ? (
              <img src={bgImageUrl} width={noticiaW} height={noticiaH} style={{ position: "absolute", top: 0, left: 0, width: noticiaW, height: noticiaH, objectFit: bgFit, display: "flex" }} alt="" />
            ) : (
              <div style={{ position: "absolute", top: 0, left: 0, width: noticiaW, height: noticiaH, background: themeBg, display: "flex" }} />
            )}
            {textureUrl ? <img src={textureUrl} width={noticiaW} height={noticiaH} style={{ position: "absolute", top: 0, left: 0, width: noticiaW, height: noticiaH, objectFit: "cover", opacity: textureOpacity / 100, display: "flex" }} alt="" /> : null}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: Math.round(noticiaH * 0.28), background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 100%)", display: "flex" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: bottomGradientH, background: "linear-gradient(180deg, transparent 0%, rgba(5,12,28,0.85) 45%, rgba(5,12,28,0.98) 100%)", display: "flex" }} />
            {logoUrl ? <img src={logoUrl} width={Math.round(72 * logoScale)} height={Math.round(72 * logoScale)} style={{ position: "absolute", top: 36 + safeTopFor(format), left: 36, objectFit: "contain", display: "flex" }} alt="Logo" /> : null}
            <div style={{ position: "absolute", top: 48 + safeTopFor(format), right: 36, display: "flex", background: "#e11d48", paddingLeft: 18, paddingRight: 18, paddingTop: 8, paddingBottom: 8, borderRadius: 999 }}>
              <span style={{ color: "white", fontSize: isBanner ? 14 : 18, fontWeight: 900, letterSpacing: 2 }}>{catText}</span>
            </div>
            <div style={{ position: "absolute", bottom: (showBottomSponsors ? sponsorBarH : 0) + safeBottomFor(format) + (isBanner ? 24 : 48), left: 48, right: 48, display: "flex", flexDirection: "column" }}>
              {noticiaFecha ? <span style={{ color: "rgba(255,255,255,0.6)", fontSize: isBanner ? 13 : 18, fontWeight: 700, letterSpacing: 3, marginBottom: isBanner ? 8 : 16, display: "flex" }}>{noticiaFecha.toUpperCase()}</span> : null}
              <span style={{ color: "white", fontSize: finalTitleSize, fontWeight: titleWeight, lineHeight: 0.95, letterSpacing: -2, display: "flex" }}>{tituloFinal}</span>
              {subtitulo ? <span style={{ color: "rgba(255,255,255,0.78)", fontSize: subtitleFinalSize, fontWeight: 500, lineHeight: 1.3, marginTop: isBanner ? 10 : 20, display: "flex" }}>{subtitulo}</span> : null}
              {noticiaUrl ? <span style={{ color: "rgba(255,255,255,0.45)", fontSize: isBanner ? 11 : 15, fontWeight: 600, letterSpacing: 1, marginTop: isBanner ? 10 : 18, display: "flex" }}>{noticiaUrl}</span> : null}
            </div>
            {showBottomSponsors ? (
              <div style={{ position: "absolute", bottom: safeBottomFor(format), left: 0, right: 0, height: sponsorBarH, background: !showSponsorBar ? "transparent" : isPremiumTheme ? premiumSponsorBarBg : sponsorBg === "white" ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
                {sponsorLogos.map((s, i) => { const h = Math.round(48 * s.scale); return <img key={i} src={s.url} width={Math.round(150 * s.scale)} height={h} style={{ objectFit: "contain", filter: sponsorFilter, opacity: sponsorOpacity }} alt={`Sponsor ${i + 1}`} /> })}
              </div>
            ) : null}
          </div>
        ),
        { width: noticiaW, height: noticiaH, fonts, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
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
      const vMult = format === "historia" ? (safeZones ? 1.0 : 1.4) : 1.0
      const tituloFinal = titulo || `Líder en ${statLabel.toLowerCase()}`
      const photoSrc = playerPhotoUrl || leader.photoUrl || ""
      return renderImage(
        (
          <div style={{ width: W, height: H, display: "flex", fontFamily: "sans-serif", position: "relative", overflow: "hidden", background: themeBg }}>
            {photoSrc ? (() => {
              const frameW = Math.round(W * 0.55)
              const imgW = Math.round(frameW * photoScale)
              const imgH = Math.round(H * photoScale)
              const offsetX = Math.round((imgW - frameW) * (photoPosX / 100))
              const offsetY = Math.round((imgH - H) * (photoPosY / 100))
              return (
                <div style={{ position: "absolute", top: 0, left: 0, width: frameW, height: H, overflow: "hidden", display: "flex" }}>
                  <img src={photoSrc} width={imgW} height={imgH} style={{ position: "absolute", top: -offsetY, left: -offsetX, width: imgW, height: imgH, objectFit: photoFit, objectPosition: `${photoPosX}% ${photoPosY}%`, display: "flex" }} alt={leader.playerName} />
                </div>
              )
            })() : null}
            {textureUrl ? <img src={textureUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover", opacity: textureOpacity / 100, display: "flex" }} alt="" /> : null}
            <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, background: "linear-gradient(90deg, transparent 0%, rgba(11,30,61,0.3) 30%, rgba(11,30,61,0.88) 52%, rgba(11,30,61,0.97) 65%, #0b1e3d 80%)", display: "flex" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: "linear-gradient(180deg, rgba(11,30,61,0.6) 0%, transparent 100%)", display: "flex" }} />
            <div style={{ position: "absolute", top: 32 + safeTopFor(format), left: 32, display: "flex", alignItems: "center", gap: 10 }}>
              {logoUrl ? <img src={logoUrl} width={Math.round(72 * logoScale)} height={Math.round(72 * logoScale)} style={{ objectFit: "contain" }} alt="Logo" /> : null}
            </div>
            <div style={{ position: "absolute", top: 0, right: 0, width: Math.round(W * 0.52), height: H, display: "flex", flexDirection: "column", paddingTop: 40 + safeTopFor(format), paddingBottom: 40 + safeBottomFor(format), paddingLeft: 24, paddingRight: 36 }}>
              <div style={{ display: "flex", flexDirection: "column", marginBottom: Math.round(28 * vMult) }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: Math.round(18 * vMult), fontWeight: 700, letterSpacing: 3, marginBottom: 6 }}>{statLabel}</span>
                <span style={{ color: "white", fontSize: Math.round(56 * vMult * titleSize), fontWeight: titleWeight, lineHeight: 1.05, letterSpacing: -1 }}>{tituloFinal}</span>
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
              <div style={{ position: "absolute", bottom: safeBottomFor(format), left: 0, right: 0, height: 80, background: !showSponsorBar ? "transparent" : isPremiumTheme ? premiumSponsorBarBg : sponsorBg === "white" ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
                {sponsorLogos.map((s, i) => { const h = Math.round(44 * s.scale); return <img key={i} src={s.url} width={Math.round(140 * s.scale)} height={h} style={{ objectFit: "contain", filter: sponsorFilter, opacity: sponsorOpacity }} alt={`Sponsor ${i + 1}`} /> })}
              </div>
            ) : null}
          </div>
        ),
        { width: W, height: H, fonts, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
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

      // Coerción explícita a string para todo lo que después renderiza
      // satori. La API de Genius a veces devuelve estos campos como
      // objetos i18n (`{en: "X", es: "X"}`) o como `null`/`undefined`; si
      // un text node de JSX recibe algo que no sea string, satori
      // explota con "Cannot read properties of undefined (reading 'trim')"
      // y el ImageResponse muere mid-stream con un 500 HTML genérico.
      const asText = (v: unknown, fallback = ""): string =>
        typeof v === "string" ? v : v == null ? fallback : String(v)
      const asUrl = (v: unknown): string | null => {
        if (typeof v !== "string") return null
        const t = v.trim()
        return t ? t : null
      }

      matchDataList.push({
        homeName: asText(home?.competitorName, "Local"),
        awayName: asText(away?.competitorName, "Visitante"),
        homeLogo: asUrl(home?.images?.logo?.L1?.url) ?? asUrl(home?.images?.logo?.S1?.url),
        awayLogo: asUrl(away?.images?.logo?.L1?.url) ?? asUrl(away?.images?.logo?.S1?.url),
        homeScore: isResultado ? (asText(home?.scoreString) || null) : null,
        awayScore: isResultado ? (asText(away?.scoreString) || null) : null,
        date: asText(date),
        time: asText(time),
        venue: asText(m.venue?.venueName ?? m.venueName),
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
    const vMult = format === "historia" ? (safeZones ? 1.0 : 1.4) : 1.0
    // Safe zone padding para Instagram Stories — empuja todo el contenido
    // hacia el área visible cuando se postea como Story.
    const safeTop = safeTopFor(format)
    const safeBottom = safeBottomFor(format)

    // Card dimensions that fit within the fixed height
    // Feed 1350: header + cards + gaps(16×(n-1)) + footer(60-130) must be ≤ 1350
    const cardW = W - 80
    // Respiro vertical entre el header y la primera tarjeta (antes todo
    // quedaba pegado). Le restamos ese padding al cardH de cada partido.
    const headerToCardsPadding = Math.round((count === 1 ? 30 : count === 2 ? 20 : count === 3 ? 14 : 10) * vMult)
    // Card dimensions que dependen del formato + del tema. Los temas
    // premium (LNB/LNBF) tienen un header mucho más grande porque el
    // título hero en Archivo Black ocupa 2 líneas grandes, y el logo
    // con su padding reserva espacio adicional. Para no overflowear,
    // el cardH base es ~13% menor cuando es premium.
    const rawCardH     = isPremiumTheme
      ? Math.round((count === 1 ? 420 : count === 2 ? 350 : count === 3 ? 258 : 208) * vMult)
      : Math.round((count === 1 ? 480 : count === 2 ? 400 : count === 3 ? 295 : 240) * vMult)
    const baseCardH    = rawCardH - Math.ceil(headerToCardsPadding / count)
    const logoSize     = Math.round((count === 1 ? 150 : count === 2 ? 120 : count === 3 ?  90 :  75) * vMult)
    const nameFontSize = Math.round((count === 1 ?  28 : count === 2 ?  24 : count === 3 ?  20 :  17) * vMult)
    const vsFontSize   = Math.round((count === 1 ?  58 : count === 2 ?  48 : count === 3 ?  40 :  34) * vMult)

    // When the user scales title/subtitle/logo beyond 100%, the header box
    // would overflow into the first match card. Grow headerH by the extra
    // pixels each scaled element needs, and steal that growth from each
    // card so the total still fits in the fixed format height.
    // Header base: en temas premium necesita ~130px extra para el
    // layout hero con logo absolute + eyebrow + título Archivo Black
    // en 2 líneas. Sin este aumento, el título overflowea y se ve
    // tapado por la primera card.
    const baseHeaderH       = isPremiumTheme
      ? Math.round((count === 1 ? 440 : count === 2 ? 400 : count === 3 ? 370 : 340) * vMult)
      : Math.round((count === 1 ? 280 : count === 2 ? 260 : count === 3 ? 240 : 210) * vMult)
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

    return renderImage(
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
          paddingTop: safeTop,
          paddingBottom: safeBottom,
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

          {/* Background glow effects. Si el tema es lnbf-premium usamos
              LNBFBackground (con pattern opcional). Si no, los 2 glows azules
              originales. Cuando hay bgImageUrl/textureUrl, ambos se ocultan
              porque el fondo custom ya aporta la decoración. */}
          {!bgImageUrl && theme === "lnbf-premium" ? (
            <LNBFBackground variant={lnbfPattern} W={W} H={H} />
          ) : !bgImageUrl && theme === "lnb-premium" ? (
            <LNBBackground variant={lnbPattern} W={W} H={H} />
          ) : !bgImageUrl && theme === "u22m-premium" ? (
            <U22MBackground variant={u22Pattern} W={W} H={H} />
          ) : !bgImageUrl && theme === "u22f-premium" ? (
            <U22FBackground variant={u22Pattern} W={W} H={H} />
          ) : !bgImageUrl ? (
            <>
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
            </>
          ) : null}

          {/* ── HEADER ── */}
          {isPremiumTheme ? (() => {
            // Palette para badge/eyebrow/línea de accent: LNBF (violet)
            // o LNB (navy+gold) según el tema elegido.
            const hdrPalette =
                theme === "lnb-premium"  ? PALETTE_LNB
              : theme === "u22m-premium" ? PALETTE_U22M
              : theme === "u22f-premium" ? PALETTE_U22F
              : PALETTE_LNBF
            // Header LNBF Premium: logo absolute top-left + badge absolute top-right,
            // eyebrow debajo, título GIGANTE left-aligned en 2 líneas.
            // Logo en POSICIÓN ABSOLUTA para que no empuje el texto cuando
            // se escala con el slider — el layout de abajo queda estable.
            const heroBase = Math.round((count === 1 ? 108 : count === 2 ? 95 : count <= 4 ? 82 : 74) * vMult)
            const heroSize = Math.round(heroBase * titleSize)
            const tituloDefault = isResultado ? "RESULTADOS\nDE LA FECHA" : "PRÓXIMOS\nPARTIDOS"
            const tituloRaw = titulo || tituloDefault
            const tituloLines = (() => {
              if (tituloRaw.includes("\n")) return tituloRaw.split("\n")
              const words = tituloRaw.split(" ")
              if (words.length === 1) return [tituloRaw]
              const mid = Math.ceil(words.length / 2)
              return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]
            })()
            const fechaBadge = lnbfBadge
            const eyebrow = subtitulo || (isResultado ? "RESULTADOS DE LA FECHA" : "ESTA SEMANA EN LA LIGA")
            const padX = 48
            // Base del logo en LNBF: más grande de entrada (lo que antes
            // era 300% ahora es 100%). Sigue respetando el slider.
            const lnbfLogoBase = Math.round((count === 1 ? 200 : count === 2 ? 175 : count <= 4 ? 145 : 120) * vMult)
            const lnbfLogoSize = Math.round(lnbfLogoBase * logoScale)
            // Padding-top del texto: reserva el espacio REAL del logo
            // (con su scale aplicado) + margen. Antes usaba un porcentaje
            // del base lo que causaba que el título empezara DENTRO del
            // área del logo cuando el logoScale era grande.
            const headerTopPad = logoUrl ? (28 + lnbfLogoSize + 24) : 40
            const isCenteredHeader = premiumHeaderLayout === "centered"
            return (
              <div style={{
                display: "flex", flexDirection: "column", width: "100%",
                height: headerH, paddingTop: headerTopPad,
                paddingLeft: padX, paddingRight: padX,
                position: "relative",
                alignItems: isCenteredHeader ? "center" : "flex-start",
              }}>
                {/* Logo — absolute top-left (split) o centrado arriba (centered) */}
                {logoUrl ? (
                  isCenteredHeader ? (
                    <img
                      src={logoUrl}
                      width={lnbfLogoSize}
                      height={lnbfLogoSize}
                      style={{
                        position: "absolute",
                        top: 28, left: "50%",
                        marginLeft: -Math.round(lnbfLogoSize / 2),
                        objectFit: "contain",
                        display: "flex",
                      }}
                      alt="Logo"
                    />
                  ) : (
                    <img
                      src={logoUrl}
                      width={lnbfLogoSize}
                      height={lnbfLogoSize}
                      style={{
                        position: "absolute",
                        top: 28, left: padX,
                        objectFit: "contain",
                        display: "flex",
                      }}
                      alt="Logo"
                    />
                  )
                ) : null}

                {/* Badge — absolute top-right (split) o centrado arriba sobre el eyebrow (centered) */}
                {fechaBadge ? (
                  isCenteredHeader ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 20px",
                      background: (theme === "lnb-premium" || theme === "u22m-premium" || theme === "u22f-premium") ? "rgba(166,190,255,0.12)" : "rgba(201,160,255,0.12)",
                      border: `1px solid ${hdrPalette.borderColor}55`,
                      borderRadius: 999,
                      marginBottom: 14,
                    }}>
                      <div style={{ display: "flex", width: 7, height: 7, borderRadius: 4, background: hdrPalette.gold }} />
                      <span style={{
                        color: hdrPalette.accentSoft,
                        fontFamily: "Inter", fontSize: Math.round(15 * vMult),
                        fontWeight: 800, letterSpacing: 2.5, display: "flex",
                      }}>
                        {fechaBadge.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      position: "absolute", top: 28, right: padX,
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 20px",
                      background: (theme === "lnb-premium" || theme === "u22m-premium" || theme === "u22f-premium") ? "rgba(166,190,255,0.12)" : "rgba(201,160,255,0.12)",
                      border: `1px solid ${hdrPalette.borderColor}55`,
                      borderRadius: 999,
                    }}>
                      <div style={{ display: "flex", width: 7, height: 7, borderRadius: 4, background: hdrPalette.gold }} />
                      <span style={{
                        color: hdrPalette.accentSoft,
                        fontFamily: "Inter", fontSize: Math.round(15 * vMult),
                        fontWeight: 800, letterSpacing: 2.5, display: "flex",
                      }}>
                        {fechaBadge.toUpperCase()}
                      </span>
                    </div>
                  )
                ) : null}

                {/* Eyebrow */}
                <span style={{
                  color: hdrPalette.accentSoft,
                  fontFamily: "Inter", fontSize: Math.round(17 * vMult),
                  fontWeight: 600, letterSpacing: 4, marginBottom: 12,
                  display: "flex",
                  textAlign: isCenteredHeader ? "center" : "left",
                }}>
                  {eyebrow.toUpperCase()}
                </span>

                {/* Título — left-aligned (split) o centered (centered) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: isCenteredHeader ? "center" : "flex-start" }}>
                  {tituloLines.map((ln, i) => (
                    <span key={i} style={{
                      color: "white", fontFamily: "Archivo Black",
                      fontSize: heroSize, fontWeight: 900,
                      letterSpacing: -4, lineHeight: 0.92, display: "flex",
                      textAlign: isCenteredHeader ? "center" : "left",
                    }}>
                      {ln.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )
          })() : (
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
          )}

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
              // Si el tema es lnbf-premium y layout es Estándar, usamos
              // MatchCardLNBF (diseño editorial con badge + horario bar).
              // Compact mantiene el diseño actual hasta que se rediseñe.
              return isPremiumTheme && layout !== "compact" ? (
                <MatchCardLNBF
                  key={i}
                  match={match}
                  matchNumber={i + 1}
                  isResultado={isResultado}
                  cardW={cardW}
                  cardH={cardH}
                  logoSize={logoSize}
                  vsFontSize={vsFontSize}
                  nameFontSize={nameFontSize}
                  showHorarioBar={lnbfShowHorarioBar}
                  palette={theme === "lnb-premium" ? PALETTE_LNB : theme === "u22m-premium" ? PALETTE_U22M : theme === "u22f-premium" ? PALETTE_U22F : PALETTE_LNBF}
                />
              ) : layout === "compact" ? (
                <MatchCardCompact key={i} match={match} isResultado={isResultado} cardW={cardW} cardH={cardH} palette={theme === "lnb-premium" ? PALETTE_LNB : theme === "u22m-premium" ? PALETTE_U22M : theme === "u22f-premium" ? PALETTE_U22F : PALETTE_LNBF} />
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
              background: !showSponsorBar ? "transparent" : isPremiumTheme ? premiumSponsorBarBg : sponsorBg === "white" ? "rgba(255,255,255,0.97)" : "rgba(0,0,0,0.6)",
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
                    style={{ objectFit: "contain", flex: "0 0 auto", filter: sponsorFilter, opacity: sponsorOpacity }}
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
      { width: W, height: H, fonts, headers: { "cache-control": "public, max-age=60, s-maxage=0, must-revalidate" } }
    )
  } catch (e: any) {
    // Surface the full chain (incluye el `cause` que tira satori cuando
    // un text node de la JSX recibe undefined). Se loguea a console
    // para que aparezca en Vercel runtime logs.
    const cause = e?.cause ? `\nCause: ${e.cause?.message ?? String(e.cause)}` : ""
    const msg = `${e?.message ?? "Error generando flyer"}${cause}`
    console.error("[flyer-v2] render error:", e)
    if (e?.cause) console.error("[flyer-v2] cause:", e.cause)
    return new Response(msg, { status: 500 })
  }
}
