// Templates V3 premium — cada uno genera objetos fabric editables con
// calidad visual V2-quality: gradiente diagonal, pattern overlay, glows
// radiales en esquinas, badge CPB editable, cards, info bar y sponsor
// strip.
//
// Como pattern overlay requiere cargar una imagen async, buildTemplate
// es async y retorna una Promise<any[]>.

import type { V3Theme } from "./themes"
import type { CanvasFormat } from "./formats"
import { hexToRgba } from "./color-utils"
import { patternDataUrl, type PatternKey } from "./patterns"

export type TemplateKey =
  | "blank"
  | "pre"
  | "proximos-multi"
  | "resultado"
  | "resultados-multi"
  | "tabla"
  | "lideres"
  | "jugador"
  | "lanzamiento"

export interface TemplateMeta {
  key: TemplateKey
  label: string
  desc: string
  needsMatch?: boolean
  needsPlayer?: boolean
  needsStandings?: boolean
  needsLeaders?: boolean
}

export const TEMPLATES: TemplateMeta[] = [
  { key: "blank",           label: "En blanco",       desc: "Empezar desde cero" },
  { key: "pre",             label: "Anuncio",         desc: "1 partido (previa)",        needsMatch: true },
  { key: "proximos-multi",  label: "Próximos",        desc: "Varios partidos (jornada)", needsMatch: true },
  { key: "resultado",       label: "Resultado",       desc: "1 partido con marcador",    needsMatch: true },
  { key: "resultados-multi",label: "Resultados",      desc: "Varios marcadores",         needsMatch: true },
  { key: "tabla",           label: "Tabla",           desc: "Posiciones",                needsStandings: true },
  { key: "lideres",         label: "Líderes",         desc: "Top estadísticas",          needsLeaders: true },
  { key: "jugador",         label: "Jugador",         desc: "Premio del partido",        needsPlayer: true },
  { key: "lanzamiento",     label: "Lanzamiento",     desc: "Arranque de temporada" },
]

export interface TemplateCtx {
  fabric: any
  theme: V3Theme
  format: CanvasFormat
  data?: any
  pattern?: PatternKey
  patternAlpha?: number
  showSponsorStrip?: boolean
  sponsorBg?: "white" | "dark"
}

// ─── Helpers ──────────────────────────────────────────────

function makeText(fabric: any, text: string, opts: any = {}): any {
  return new fabric.IText(text, {
    editable: true,
    selectable: true,
    originX: "left",
    originY: "top",
    ...opts,
  })
}

function makeRect(fabric: any, opts: any = {}): any {
  return new fabric.Rect({
    originX: "left",
    originY: "top",
    ...opts,
  })
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// Fondo primario con gradiente diagonal premium (4 stops)
function makeBgGradient(fabric: any, theme: V3Theme, format: CanvasFormat): any {
  const rect = new fabric.Rect({
    left: 0, top: 0,
    width: format.width, height: format.height,
    selectable: false, evented: false,
    excludeFromSnap: true, role: "background",
  })
  const grad = new fabric.Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: format.width, y2: format.height },
    colorStops: [
      { offset: 0,    color: theme.accentAlt },
      { offset: 0.35, color: theme.bgAlt },
      { offset: 0.75, color: theme.bg },
      { offset: 1,    color: theme.bg },
    ],
  })
  rect.set("fill", grad)
  return rect
}

// Pattern overlay — async porque carga imagen SVG como tile
async function makePatternOverlay(
  fabric: any, format: CanvasFormat,
  pattern: PatternKey, color: string, alpha: number,
): Promise<any | null> {
  if (!pattern || pattern === "none") return null
  const url = patternDataUrl(pattern, color, alpha)
  if (!url) return null
  try {
    const img = await loadImage(url)
    const rect = new fabric.Rect({
      left: 0, top: 0,
      width: format.width, height: format.height,
      selectable: false, evented: false,
      excludeFromSnap: true, role: "pattern",
    })
    const pat = new fabric.Pattern({ source: img, repeat: "repeat" })
    rect.set("fill", pat)
    return rect
  } catch {
    return null
  }
}

// Glow radial (rect cuadrado con fill radial gradient, posicionado en esquina)
function makeGlow(
  fabric: any, cx: number, cy: number, radius: number,
  colorHex: string, alpha = 0.4,
): any {
  const size = radius * 2
  const rect = new fabric.Rect({
    left: cx - radius, top: cy - radius,
    width: size, height: size,
    selectable: false, evented: false,
    excludeFromSnap: true, role: "glow",
  })
  const grad = new fabric.Gradient({
    type: "radial",
    coords: { x1: radius, y1: radius, r1: 0, x2: radius, y2: radius, r2: radius },
    colorStops: [
      { offset: 0,    color: hexToRgba(colorHex, alpha) },
      { offset: 0.55, color: hexToRgba(colorHex, alpha * 0.35) },
      { offset: 1,    color: hexToRgba(colorHex, 0) },
    ],
  })
  rect.set("fill", grad)
  return rect
}

// Badge CPB arriba (stroke dorado con texto)
function makeBadge(fabric: any, theme: V3Theme, format: CanvasFormat): any[] {
  const w = format.width * 0.16
  const h = format.width * 0.055
  const x = format.width / 2 - w / 2
  const y = format.height * 0.04
  const box = makeRect(fabric, {
    left: x, top: y, width: w, height: h,
    fill: hexToRgba(theme.bg, 0.55),
    stroke: theme.accent,
    strokeWidth: 1.5,
    rx: 999, ry: 999,
    role: "badge-box",
  })
  const text = makeText(fabric, "CPB · 2026", {
    fontFamily: theme.fontHeading,
    fontSize: h * 0.48,
    fill: theme.accent,
    fontWeight: "bold",
    charSpacing: 150,
    left: format.width / 2, top: y + h / 2,
    originX: "center", originY: "center",
    role: "badge-text",
  })
  return [box, text]
}

// Info bar editable con gradient sutil
function makeInfoBar(
  fabric: any, theme: V3Theme, format: CanvasFormat,
  y: number, label: string,
): any[] {
  const barW = format.width * 0.82
  const barH = format.height * 0.07
  const x = (format.width - barW) / 2
  const bar = makeRect(fabric, {
    left: x, top: y, width: barW, height: barH,
    fill: hexToRgba(theme.bg, 0.7),
    stroke: hexToRgba(theme.accent, 0.3),
    strokeWidth: 1,
    rx: 16, ry: 16,
    role: "info-bar",
  })
  const text = makeText(fabric, label, {
    fontFamily: theme.fontBody,
    fontSize: barH * 0.36,
    fill: theme.fg,
    fontWeight: "bold",
    charSpacing: 30,
    left: format.width / 2, top: y + barH / 2,
    originX: "center", originY: "center",
    role: "info-text",
  })
  return [bar, text]
}

// Sponsor strip al pie del canvas
function makeSponsorStrip(
  fabric: any, theme: V3Theme, format: CanvasFormat,
  bg: "white" | "dark",
): any[] {
  const stripH = format.height * 0.075
  const y = format.height - stripH
  const stripBg = makeRect(fabric, {
    left: 0, top: y, width: format.width, height: stripH,
    fill: bg === "white" ? "#FFFFFF" : hexToRgba(theme.bg, 0.88),
    selectable: true,
    role: "sponsor-strip-bg",
  })
  const label = makeText(fabric, "PATROCINADORES", {
    fontFamily: theme.fontHeading,
    fontSize: stripH * 0.18,
    fill: bg === "white" ? theme.bg : theme.fgMuted,
    charSpacing: 300,
    left: format.width / 2, top: y + stripH * 0.15,
    originX: "center", originY: "top",
    role: "sponsor-label",
  })
  // 5 slots placeholder (cuadros sutiles)
  const slots: any[] = []
  const slotW = format.width * 0.13
  const slotH = stripH * 0.45
  const gap = (format.width - slotW * 5) / 6
  for (let i = 0; i < 5; i++) {
    const sx = gap + i * (slotW + gap)
    const sy = y + stripH * 0.42
    slots.push(makeRect(fabric, {
      left: sx, top: sy, width: slotW, height: slotH,
      fill: bg === "white" ? "#F2F2F2" : hexToRgba(theme.fg, 0.05),
      stroke: bg === "white" ? "#E5E5E5" : hexToRgba(theme.fg, 0.12),
      strokeWidth: 1, rx: 6, ry: 6,
      role: `sponsor-slot-${i}`,
    }))
  }
  return [stripBg, label, ...slots]
}

// Línea decorativa dorada con glow
function makeAccentLine(
  fabric: any, theme: V3Theme, cx: number, y: number, w: number,
): any {
  return makeRect(fabric, {
    left: cx - w / 2, top: y, width: w, height: 2,
    fill: theme.accent,
    selectable: true,
    role: "accent-line",
    shadow: `0 0 12px ${theme.accent}`,
  })
}

// Arma las capas de fondo comunes (gradient + pattern + 2 glows)
async function makeBackgroundStack(ctx: TemplateCtx): Promise<any[]> {
  const { fabric, theme, format, pattern, patternAlpha } = ctx
  const items: any[] = []
  items.push(makeBgGradient(fabric, theme, format))
  const overlay = await makePatternOverlay(
    fabric, format,
    pattern ?? "none",
    theme.fg,
    patternAlpha ?? 0.05,
  )
  if (overlay) items.push(overlay)
  // Glow dorado arriba-izquierda
  items.push(makeGlow(fabric, format.width * 0.15, format.height * 0.1, format.width * 0.55, theme.accent, 0.3))
  // Glow accent alt abajo-derecha
  items.push(makeGlow(fabric, format.width * 0.9, format.height * 0.85, format.width * 0.6, theme.accentAlt, 0.35))
  return items
}

// ─── TEMPLATES ────────────────────────────────────────────

async function tplBlank(ctx: TemplateCtx): Promise<any[]> {
  return await makeBackgroundStack(ctx)
}

// Pre-match: badge + eyebrow + título + logos + vs + nombres + info + sponsors
async function tplPre(ctx: TemplateCtx): Promise<any[]> {
  const { fabric, theme, format, data } = ctx
  const cx = format.width / 2
  const out: any[] = await makeBackgroundStack(ctx)
  out.push(...makeBadge(fabric, theme, format))

  // Eyebrow con dots
  const eyebrowY = format.height * 0.13
  out.push(makeText(fabric, "•  " + (data?.ligaLabel || "LNB APERTURA 2026") + "  •", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.028,
    fill: theme.accent,
    charSpacing: 250,
    fontWeight: "bold",
    left: cx, top: eyebrowY, originX: "center",
    role: "eyebrow",
  }))
  out.push(makeAccentLine(fabric, theme, cx, eyebrowY + format.width * 0.045, format.width * 0.12))

  // Título en 2 líneas (evita overflow)
  out.push(makeText(fabric, "PRÓXIMO", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.13,
    fill: theme.fg, fontWeight: "900",
    left: cx, top: format.height * 0.19, originX: "center",
    role: "title-1",
    shadow: hexToRgba(theme.bg, 0.6) + " 0 4px 20px",
  }))
  out.push(makeText(fabric, "PARTIDO", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.13,
    fill: theme.fg, fontWeight: "900",
    left: cx, top: format.height * 0.29, originX: "center",
    role: "title-2",
  }))

  // VS circle con stroke dorado
  const vsR = format.width * 0.085
  out.push(new fabric.Circle({
    left: cx - vsR, top: format.height * 0.49 - vsR,
    radius: vsR,
    fill: hexToRgba(theme.bg, 0.7),
    stroke: theme.accent,
    strokeWidth: 2.5,
    role: "vs-circle",
  }))
  out.push(makeText(fabric, "VS", {
    fontFamily: theme.fontDisplay,
    fontSize: vsR * 0.95,
    fill: theme.accent, fontWeight: "900",
    left: cx, top: format.height * 0.49,
    originX: "center", originY: "center",
    role: "vs",
  }))

  // Cards local/visitante (2 rects sutiles con gradiente)
  const cardW = format.width * 0.38
  const cardH = format.height * 0.19
  const cardY = format.height * 0.415

  const homeCard = makeRect(fabric, {
    left: format.width * 0.06, top: cardY, width: cardW, height: cardH,
    fill: hexToRgba(theme.bg, 0.35),
    stroke: hexToRgba(theme.accent, 0.35),
    strokeWidth: 1, rx: 18, ry: 18,
    role: "home-card",
  })
  const awayCard = makeRect(fabric, {
    left: format.width - format.width * 0.06 - cardW, top: cardY,
    width: cardW, height: cardH,
    fill: hexToRgba(theme.bg, 0.35),
    stroke: hexToRgba(theme.fgMuted, 0.25),
    strokeWidth: 1, rx: 18, ry: 18,
    role: "away-card",
  })
  out.push(homeCard, awayCard)

  // Labels LOCAL / VISITANTE sobre cards
  out.push(makeText(fabric, "LOCAL", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.022,
    fill: theme.accent, charSpacing: 250, fontWeight: "bold",
    left: format.width * 0.06 + cardW / 2,
    top: cardY + format.height * 0.012,
    originX: "center", role: "home-label",
  }))
  out.push(makeText(fabric, "VISITANTE", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.022,
    fill: theme.fgMuted, charSpacing: 250, fontWeight: "bold",
    left: format.width - format.width * 0.06 - cardW / 2,
    top: cardY + format.height * 0.012,
    originX: "center", role: "away-label",
  }))

  // Nombres de equipos
  out.push(makeText(fabric, (data?.homeName || "EQUIPO LOCAL").toUpperCase(), {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.042,
    fill: theme.fg,
    left: format.width * 0.06 + cardW / 2,
    top: cardY + cardH * 0.72,
    originX: "center", textAlign: "center",
    role: "homeName",
  }))
  out.push(makeText(fabric, (data?.awayName || "EQUIPO VISIT.").toUpperCase(), {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.042,
    fill: theme.fg,
    left: format.width - format.width * 0.06 - cardW / 2,
    top: cardY + cardH * 0.72,
    originX: "center", textAlign: "center",
    role: "awayName",
  }))

  // Info bar con fecha y venue
  const info = (data?.dateLabel || "SÁB 20:30") + "   ·   " + (data?.venue || "POLIDEPORTIVO")
  const infoY = format.height * 0.715
  out.push(...makeInfoBar(fabric, theme, format, infoY, info))

  // Sponsor strip
  if (ctx.showSponsorStrip !== false) {
    out.push(...makeSponsorStrip(fabric, theme, format, ctx.sponsorBg || "dark"))
  }

  return out
}

// Resultado final
async function tplResultado(ctx: TemplateCtx): Promise<any[]> {
  const { fabric, theme, format, data } = ctx
  const cx = format.width / 2
  const out: any[] = await makeBackgroundStack(ctx)
  out.push(...makeBadge(fabric, theme, format))

  const eyebrowY = format.height * 0.13
  out.push(makeText(fabric, "•  RESULTADO FINAL  •", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.028,
    fill: theme.accent,
    charSpacing: 250, fontWeight: "bold",
    left: cx, top: eyebrowY, originX: "center",
    role: "eyebrow",
  }))
  out.push(makeAccentLine(fabric, theme, cx, eyebrowY + format.width * 0.045, format.width * 0.12))

  // Score grande en el centro
  const scoreY = format.height * 0.33
  out.push(makeText(fabric, String(data?.homeScore ?? "85"), {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.24,
    fill: theme.fg, fontWeight: "900",
    left: format.width * 0.26, top: scoreY,
    originX: "center", role: "homeScore",
    shadow: hexToRgba(theme.bg, 0.6) + " 0 4px 20px",
  }))
  out.push(makeText(fabric, "—", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.12,
    fill: theme.accent,
    left: cx, top: scoreY + format.width * 0.05,
    originX: "center", role: "dash",
  }))
  out.push(makeText(fabric, String(data?.awayScore ?? "72"), {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.24,
    fill: theme.fgMuted, fontWeight: "900",
    left: format.width * 0.74, top: scoreY,
    originX: "center", role: "awayScore",
  }))

  // Nombres debajo del score
  const nameY = format.height * 0.62
  out.push(makeText(fabric, (data?.homeName || "LOCAL").toUpperCase(), {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.04,
    fill: theme.fg,
    left: format.width * 0.26, top: nameY,
    originX: "center", role: "homeName",
  }))
  out.push(makeText(fabric, (data?.awayName || "VISIT.").toUpperCase(), {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.04,
    fill: theme.fgMuted,
    left: format.width * 0.74, top: nameY,
    originX: "center", role: "awayName",
  }))

  // Info bar
  const info = (data?.dateLabel || "JORNADA X") + "   ·   " + (data?.venue || "POLIDEPORTIVO")
  out.push(...makeInfoBar(fabric, theme, format, format.height * 0.72, info))

  // Sponsor strip
  if (ctx.showSponsorStrip !== false) {
    out.push(...makeSponsorStrip(fabric, theme, format, ctx.sponsorBg || "dark"))
  }

  return out
}

// Tabla de posiciones
async function tplTabla(ctx: TemplateCtx): Promise<any[]> {
  const { fabric, theme, format, data } = ctx
  const cx = format.width / 2
  const out: any[] = await makeBackgroundStack(ctx)
  out.push(...makeBadge(fabric, theme, format))

  const eyebrowY = format.height * 0.13
  out.push(makeText(fabric, "•  " + (data?.ligaLabel || "LNB APERTURA 2026") + "  •", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.025,
    fill: theme.accent, charSpacing: 250, fontWeight: "bold",
    left: cx, top: eyebrowY, originX: "center",
    role: "eyebrow",
  }))
  out.push(makeText(fabric, "POSICIONES", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.1,
    fill: theme.fg, fontWeight: "900",
    left: cx, top: format.height * 0.17, originX: "center",
    role: "title",
    shadow: hexToRgba(theme.bg, 0.6) + " 0 4px 20px",
  }))
  out.push(makeAccentLine(fabric, theme, cx, format.height * 0.27, format.width * 0.15))

  const rows = Array.isArray(data?.standings) && data.standings.length > 0
    ? data.standings.slice(0, 10)
    : [
        { pos: 1, name: "Olimpia Kings",      w: 9, l: 1 },
        { pos: 2, name: "Ciudad del Este",    w: 8, l: 2 },
        { pos: 3, name: "San José",           w: 7, l: 3 },
        { pos: 4, name: "Félix Pérez Cardozo", w: 6, l: 4 },
        { pos: 5, name: "Colonias Gold",      w: 5, l: 5 },
      ]

  const startY = format.height * 0.32
  const rowH = format.height * 0.055
  rows.forEach((r: any, i: number) => {
    const y = startY + i * rowH
    out.push(makeRect(fabric, {
      left: format.width * 0.08, top: y,
      width: format.width * 0.84, height: rowH * 0.88,
      fill: i < 4 ? hexToRgba(theme.accent, 0.1) : hexToRgba(theme.bg, 0.45),
      stroke: hexToRgba(theme.accent, i < 4 ? 0.3 : 0.1),
      strokeWidth: 1, rx: 10, ry: 10,
      role: `row-bg-${i}`,
    }))
    out.push(makeText(fabric, String(r.pos ?? i + 1).padStart(2, "0"), {
      fontFamily: theme.fontDisplay,
      fontSize: rowH * 0.55,
      fill: i < 4 ? theme.accent : theme.fgMuted,
      left: format.width * 0.11, top: y + rowH * 0.18,
      role: `row-pos-${i}`,
    }))
    out.push(makeText(fabric, String(r.name || r.teamName || "—").toUpperCase(), {
      fontFamily: theme.fontDisplay,
      fontSize: rowH * 0.42,
      fill: theme.fg,
      left: format.width * 0.22, top: y + rowH * 0.26,
      role: `row-name-${i}`,
    }))
    out.push(makeText(fabric, `${r.w ?? 0}–${r.l ?? 0}`, {
      fontFamily: theme.fontBody,
      fontSize: rowH * 0.4,
      fill: theme.fg, fontWeight: "bold",
      left: format.width * 0.8, top: y + rowH * 0.28,
      role: `row-record-${i}`,
    }))
  })

  if (ctx.showSponsorStrip !== false) {
    out.push(...makeSponsorStrip(fabric, theme, format, ctx.sponsorBg || "dark"))
  }
  return out
}

// Líderes
async function tplLideres(ctx: TemplateCtx): Promise<any[]> {
  const { fabric, theme, format, data } = ctx
  const cx = format.width / 2
  const out: any[] = await makeBackgroundStack(ctx)
  out.push(...makeBadge(fabric, theme, format))

  const eyebrowY = format.height * 0.13
  out.push(makeText(fabric, "•  TOP DE LA SEMANA  •", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.028,
    fill: theme.accent, charSpacing: 250, fontWeight: "bold",
    left: cx, top: eyebrowY, originX: "center",
    role: "eyebrow",
  }))
  out.push(makeText(fabric, "LÍDERES", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.15,
    fill: theme.fg, fontWeight: "900",
    left: cx, top: format.height * 0.17, originX: "center",
    role: "title",
    shadow: hexToRgba(theme.bg, 0.6) + " 0 4px 20px",
  }))
  out.push(makeAccentLine(fabric, theme, cx, format.height * 0.305, format.width * 0.15))

  const items = Array.isArray(data?.leaders) && data.leaders.length > 0
    ? data.leaders.slice(0, 5)
    : [
        { name: "Juan Pérez",    team: "OLI", value: 28.4 },
        { name: "Luis Martínez", team: "CDE", value: 24.1 },
        { name: "Diego Gómez",   team: "SJO", value: 22.7 },
        { name: "Pablo Cáceres", team: "FPC", value: 20.3 },
        { name: "Mario Torres",  team: "COL", value: 19.0 },
      ]

  const startY = format.height * 0.36
  const rowH = format.height * 0.09
  items.forEach((p: any, i: number) => {
    const y = startY + i * rowH
    out.push(makeRect(fabric, {
      left: format.width * 0.06, top: y,
      width: format.width * 0.88, height: rowH * 0.85,
      fill: hexToRgba(theme.bg, 0.45),
      stroke: hexToRgba(theme.accent, i === 0 ? 0.5 : 0.18),
      strokeWidth: i === 0 ? 2 : 1, rx: 14, ry: 14,
      role: `lead-bg-${i}`,
    }))
    out.push(makeText(fabric, String(i + 1), {
      fontFamily: theme.fontDisplay,
      fontSize: rowH * 0.65,
      fill: theme.accent, fontWeight: "900",
      left: format.width * 0.1, top: y + rowH * 0.1,
      role: `lead-pos-${i}`,
    }))
    out.push(makeText(fabric, (p.name || "").toUpperCase(), {
      fontFamily: theme.fontDisplay,
      fontSize: rowH * 0.38,
      fill: theme.fg,
      left: format.width * 0.22, top: y + rowH * 0.13,
      role: `lead-name-${i}`,
    }))
    out.push(makeText(fabric, (p.team || "").toUpperCase(), {
      fontFamily: theme.fontHeading,
      fontSize: rowH * 0.26,
      fill: theme.fgMuted, charSpacing: 200,
      left: format.width * 0.22, top: y + rowH * 0.55,
      role: `lead-team-${i}`,
    }))
    out.push(makeText(fabric, String(p.value ?? ""), {
      fontFamily: theme.fontDisplay,
      fontSize: rowH * 0.6,
      fill: theme.fg, fontWeight: "900",
      left: format.width * 0.85, top: y + rowH * 0.12,
      originX: "right",
      role: `lead-value-${i}`,
    }))
  })

  if (ctx.showSponsorStrip !== false) {
    out.push(...makeSponsorStrip(fabric, theme, format, ctx.sponsorBg || "dark"))
  }
  return out
}

// Jugador del partido
async function tplJugador(ctx: TemplateCtx): Promise<any[]> {
  const { fabric, theme, format, data } = ctx
  const cx = format.width / 2
  const out: any[] = await makeBackgroundStack(ctx)
  out.push(...makeBadge(fabric, theme, format))

  const eyebrowY = format.height * 0.13
  out.push(makeText(fabric, "•  JUGADOR DEL PARTIDO  •", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.028,
    fill: theme.accent, charSpacing: 250, fontWeight: "bold",
    left: cx, top: eyebrowY, originX: "center",
    role: "eyebrow",
  }))
  out.push(makeAccentLine(fabric, theme, cx, eyebrowY + format.width * 0.045, format.width * 0.14))

  // Placeholder para foto del jugador (rect con border)
  const photoY = format.height * 0.22
  const photoH = format.height * 0.38
  out.push(makeRect(fabric, {
    left: format.width * 0.22, top: photoY,
    width: format.width * 0.56, height: photoH,
    fill: hexToRgba(theme.bg, 0.35),
    stroke: hexToRgba(theme.accent, 0.35),
    strokeWidth: 1.5, rx: 18, ry: 18,
    role: "photo-placeholder",
  }))
  out.push(makeText(fabric, "Arrastrá la foto del jugador acá", {
    fontFamily: theme.fontBody,
    fontSize: format.width * 0.022,
    fill: theme.fgMuted,
    left: cx, top: photoY + photoH / 2,
    originX: "center", originY: "center",
    role: "photo-hint",
  }))

  // Nombre + equipo
  out.push(makeText(fabric, (data?.playerName || "NOMBRE APELLIDO").toUpperCase(), {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.08,
    fill: theme.fg, fontWeight: "900",
    left: cx, top: format.height * 0.63, originX: "center",
    role: "playerName",
    shadow: hexToRgba(theme.bg, 0.5) + " 0 3px 14px",
  }))
  out.push(makeText(fabric, (data?.teamName || "EQUIPO").toUpperCase(), {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.034,
    fill: theme.accent, charSpacing: 250,
    left: cx, top: format.height * 0.71, originX: "center",
    role: "playerTeam",
  }))

  // 3 stats grandes
  const stats = data?.stats || [
    { label: "PTS", value: "28" },
    { label: "REB", value: "9" },
    { label: "AST", value: "6" },
  ]
  const statsY = format.height * 0.79
  const colW = format.width / (stats.length + 1)
  stats.forEach((s: any, i: number) => {
    const x = colW * (i + 1)
    out.push(makeText(fabric, String(s.value), {
      fontFamily: theme.fontDisplay,
      fontSize: format.width * 0.075,
      fill: theme.accent, fontWeight: "900",
      left: x, top: statsY, originX: "center",
      role: `stat-value-${i}`,
    }))
    out.push(makeText(fabric, s.label, {
      fontFamily: theme.fontHeading,
      fontSize: format.width * 0.025,
      fill: theme.fgMuted, charSpacing: 300,
      left: x, top: statsY + format.width * 0.085,
      originX: "center",
      role: `stat-label-${i}`,
    }))
  })

  if (ctx.showSponsorStrip !== false) {
    out.push(...makeSponsorStrip(fabric, theme, format, ctx.sponsorBg || "dark"))
  }
  return out
}

// Lanzamiento de temporada
async function tplLanzamiento(ctx: TemplateCtx): Promise<any[]> {
  const { fabric, theme, format } = ctx
  const cx = format.width / 2
  const cy = format.height / 2
  const out: any[] = await makeBackgroundStack(ctx)
  out.push(...makeBadge(fabric, theme, format))

  out.push(makeText(fabric, "•  ARRANCA LA TEMPORADA  •", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.028,
    fill: theme.accent, charSpacing: 250, fontWeight: "bold",
    left: cx, top: cy - format.width * 0.24, originX: "center",
    role: "eyebrow",
  }))
  out.push(makeAccentLine(fabric, theme, cx, cy - format.width * 0.19, format.width * 0.18))
  out.push(makeText(fabric, "APERTURA", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.2,
    fill: theme.fg, fontWeight: "900",
    left: cx, top: cy - format.width * 0.15, originX: "center",
    role: "title-1",
    shadow: hexToRgba(theme.bg, 0.7) + " 0 4px 24px",
  }))
  out.push(makeText(fabric, "2026", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.26,
    fill: theme.accent, fontWeight: "900",
    left: cx, top: cy, originX: "center",
    role: "title-2",
    shadow: hexToRgba(theme.accent, 0.4) + " 0 0 30px",
  }))
  out.push(makeAccentLine(fabric, theme, cx, cy + format.width * 0.17, format.width * 0.18))
  out.push(makeText(fabric, "13 DE ABRIL", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.06,
    fill: theme.fg,
    left: cx, top: cy + format.width * 0.2, originX: "center",
    role: "date",
  }))
  out.push(makeText(fabric, "Seguí todos los partidos en vivo", {
    fontFamily: theme.fontBody,
    fontSize: format.width * 0.028,
    fill: theme.fgMuted,
    left: cx, top: cy + format.width * 0.3, originX: "center",
    role: "sub",
  }))

  if (ctx.showSponsorStrip !== false) {
    out.push(...makeSponsorStrip(fabric, theme, format, ctx.sponsorBg || "dark"))
  }
  return out
}

// Card de partido reutilizable (para multi). Devuelve objetos fabric + un
// "slot" donde se deben cargar los logos (el caller los inserta después).
function makeMatchCard(
  fabric: any, theme: V3Theme, format: CanvasFormat,
  x: number, y: number, w: number, h: number,
  idx: number, match: any,
): any[] {
  const objs: any[] = []
  // fondo card
  objs.push(new fabric.Rect({
    left: x, top: y, width: w, height: h,
    originX: "left", originY: "top",
    fill: hexToRgba(theme.bg, 0.55),
    stroke: hexToRgba(theme.accent, 0.35),
    strokeWidth: 1.5, rx: 18, ry: 18,
    role: `card-bg-${idx}`,
  }))
  // etiqueta JUEGO NN
  objs.push(makeText(fabric, `• JUEGO ${String(idx + 1).padStart(2, "0")}`, {
    fontFamily: theme.fontHeading,
    fontSize: h * 0.08,
    fill: theme.accent,
    charSpacing: 250, fontWeight: "bold",
    left: x + w * 0.04, top: y + h * 0.07,
    role: `card-label-${idx}`,
  }))
  // VS central
  objs.push(makeText(fabric, "VS", {
    fontFamily: theme.fontDisplay,
    fontSize: h * 0.24,
    fill: theme.accent, fontWeight: "900",
    left: x + w / 2, top: y + h * 0.36,
    originX: "center", originY: "center",
    role: `card-vs-${idx}`,
  }))
  // underline dorado bajo VS
  objs.push(new fabric.Rect({
    left: x + w / 2 - w * 0.025, top: y + h * 0.52,
    width: w * 0.05, height: 2,
    originX: "left", originY: "top",
    fill: theme.accent,
    role: `card-vs-line-${idx}`,
  }))
  // nombres
  objs.push(makeText(fabric, (match.homeName || "—").toUpperCase(), {
    fontFamily: theme.fontDisplay,
    fontSize: h * 0.14,
    fill: theme.fg, fontWeight: "900",
    left: x + w * 0.22, top: y + h * 0.58,
    originX: "center", textAlign: "center",
    role: `card-home-${idx}`,
  }))
  objs.push(makeText(fabric, (match.awayName || "—").toUpperCase(), {
    fontFamily: theme.fontDisplay,
    fontSize: h * 0.14,
    fill: theme.fg, fontWeight: "900",
    left: x + w * 0.78, top: y + h * 0.58,
    originX: "center", textAlign: "center",
    role: `card-away-${idx}`,
  }))
  // info pill al pie (estadio · fecha · hora)
  const pillY = y + h * 0.8
  const pillH = h * 0.15
  objs.push(new fabric.Rect({
    left: x + w * 0.03, top: pillY, width: w * 0.94, height: pillH,
    originX: "left", originY: "top",
    fill: hexToRgba(theme.bg, 0.75),
    stroke: hexToRgba(theme.accent, 0.25),
    strokeWidth: 1, rx: 10, ry: 10,
    role: `card-pill-${idx}`,
  }))
  // fechas + venue en texto — con íconos inline en texto (📍 📅 🕐 unicode)
  const pillText = `📍 ${match.venue || "—"}   📅 ${match.dateLabel?.split(" · ")[0] || match.dateLabel || "—"}   🕐 ${match.dateLabel?.split(" · ")[1] || ""}`
  objs.push(makeText(fabric, pillText, {
    fontFamily: theme.fontBody,
    fontSize: pillH * 0.5,
    fill: theme.fg, fontWeight: "bold",
    charSpacing: 40,
    left: x + w / 2, top: pillY + pillH / 2,
    originX: "center", originY: "center",
    role: `card-pill-text-${idx}`,
  }))

  // Si es resultado, score grande sobre el VS
  if (match.homeScore != null || match.awayScore != null) {
    objs.push(makeText(fabric, `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`, {
      fontFamily: theme.fontDisplay,
      fontSize: h * 0.3,
      fill: theme.fg, fontWeight: "900",
      left: x + w / 2, top: y + h * 0.36,
      originX: "center", originY: "center",
      role: `card-score-${idx}`,
    }))
  }

  return objs
}

// Próximos partidos (1-4 partidos en 1 diseño, estilo V2 Stories)
async function tplProximosMulti(ctx: TemplateCtx): Promise<any[]> {
  const { fabric, theme, format, data } = ctx
  const cx = format.width / 2
  const matches: any[] = Array.isArray(data?.matches) ? data.matches.slice(0, 4) : [data]
  const out: any[] = await makeBackgroundStack(ctx)
  out.push(...makeBadge(fabric, theme, format))

  // Eyebrow "FECHA X" + Título
  const eyebrowY = format.height * 0.1
  out.push(makeText(fabric, data?.fechaLabel || "JORNADA", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.028,
    fill: theme.accent, charSpacing: 300, fontWeight: "bold",
    left: format.width * 0.08, top: eyebrowY,
    role: "eyebrow",
  }))
  out.push(makeText(fabric, "PRÓXIMOS", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.11,
    fill: theme.fg, fontWeight: "900",
    left: format.width * 0.08, top: eyebrowY + format.height * 0.027,
    role: "title-1",
    shadow: hexToRgba(theme.bg, 0.6) + " 0 4px 20px",
  }))
  out.push(makeText(fabric, "PARTIDOS", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.11,
    fill: theme.fg, fontWeight: "900",
    left: format.width * 0.08, top: eyebrowY + format.height * 0.095,
    role: "title-2",
  }))

  // Grid de cards
  const listTop = format.height * 0.26
  const listBottom = format.height * (ctx.showSponsorStrip === false ? 0.95 : 0.88)
  const gap = format.height * 0.015
  const cardH = (listBottom - listTop - gap * (matches.length - 1)) / Math.max(matches.length, 1)
  const cardW = format.width * 0.88
  const cardX = (format.width - cardW) / 2

  matches.forEach((m: any, i: number) => {
    const y = listTop + i * (cardH + gap)
    out.push(...makeMatchCard(fabric, theme, format, cardX, y, cardW, cardH, i, m))
  })

  if (ctx.showSponsorStrip !== false) {
    out.push(...makeSponsorStrip(fabric, theme, format, ctx.sponsorBg || "dark"))
  }
  return out
}

// Resultados múltiples (mismas cards pero con score)
async function tplResultadosMulti(ctx: TemplateCtx): Promise<any[]> {
  const { fabric, theme, format, data } = ctx
  const matches: any[] = Array.isArray(data?.matches) ? data.matches.slice(0, 4) : [data]
  const out: any[] = await makeBackgroundStack(ctx)
  out.push(...makeBadge(fabric, theme, format))

  const eyebrowY = format.height * 0.1
  out.push(makeText(fabric, data?.fechaLabel || "JORNADA", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.028,
    fill: theme.accent, charSpacing: 300, fontWeight: "bold",
    left: format.width * 0.08, top: eyebrowY,
    role: "eyebrow",
  }))
  out.push(makeText(fabric, "RESULTADOS", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.11,
    fill: theme.fg, fontWeight: "900",
    left: format.width * 0.08, top: eyebrowY + format.height * 0.027,
    role: "title-1",
    shadow: hexToRgba(theme.bg, 0.6) + " 0 4px 20px",
  }))

  const listTop = format.height * 0.22
  const listBottom = format.height * (ctx.showSponsorStrip === false ? 0.95 : 0.88)
  const gap = format.height * 0.015
  const cardH = (listBottom - listTop - gap * (matches.length - 1)) / Math.max(matches.length, 1)
  const cardW = format.width * 0.88
  const cardX = (format.width - cardW) / 2

  matches.forEach((m: any, i: number) => {
    const y = listTop + i * (cardH + gap)
    out.push(...makeMatchCard(fabric, theme, format, cardX, y, cardW, cardH, i, m))
  })

  if (ctx.showSponsorStrip !== false) {
    out.push(...makeSponsorStrip(fabric, theme, format, ctx.sponsorBg || "dark"))
  }
  return out
}

export async function buildTemplate(key: TemplateKey, ctx: TemplateCtx): Promise<any[]> {
  switch (key) {
    case "pre":               return await tplPre(ctx)
    case "proximos-multi":    return await tplProximosMulti(ctx)
    case "resultado":         return await tplResultado(ctx)
    case "resultados-multi":  return await tplResultadosMulti(ctx)
    case "tabla":             return await tplTabla(ctx)
    case "lideres":           return await tplLideres(ctx)
    case "jugador":           return await tplJugador(ctx)
    case "lanzamiento":       return await tplLanzamiento(ctx)
    case "blank":
    default:                  return await tplBlank(ctx)
  }
}
