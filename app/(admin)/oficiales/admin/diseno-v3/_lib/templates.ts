// Templates V3 — a diferencia del V2 que renderizaba server-side, acá
// cada template genera una LISTA DE OBJETOS FABRIC que se insertan en el
// canvas. Todo queda editable después: se puede mover, cambiar texto,
// cambiar color, etc.
//
// Cada función recibe el contexto (theme, formato, datos opcionales de
// Genius) y devuelve un array de objetos fabric listos para agregar.
//
// fabric se pasa como parámetro (no importamos estático) porque es un
// módulo solo-cliente.

import type { V3Theme } from "./themes"
import type { CanvasFormat } from "./formats"

export type TemplateKey =
  | "blank"
  | "pre"
  | "resultado"
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
  { key: "blank",       label: "En blanco",    desc: "Empezar desde cero" },
  { key: "pre",         label: "Anuncio",      desc: "Antes del partido",     needsMatch: true },
  { key: "resultado",   label: "Resultado",    desc: "Con marcador final",    needsMatch: true },
  { key: "tabla",       label: "Tabla",        desc: "Posiciones",            needsStandings: true },
  { key: "lideres",     label: "Líderes",      desc: "Top estadísticas",      needsLeaders: true },
  { key: "jugador",     label: "Jugador",      desc: "Premio del partido",    needsPlayer: true },
  { key: "lanzamiento", label: "Lanzamiento",  desc: "Arranque de temporada" },
]

export interface TemplateCtx {
  fabric: any
  theme: V3Theme
  format: CanvasFormat
  data?: any
}

// Helpers para construir objetos con metadata común
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

function makeBackground(fabric: any, theme: V3Theme, format: CanvasFormat): any {
  // Gradiente vertical simulando el bgGradient del tema
  const rect = new fabric.Rect({
    left: 0,
    top: 0,
    width: format.width,
    height: format.height,
    selectable: false,
    evented: false,
    excludeFromSnap: true,
    role: "background",
  })
  // Gradiente de fondo
  const coords = { x1: 0, y1: 0, x2: 0, y2: format.height }
  const grad = new fabric.Gradient({
    type: "linear",
    coords,
    colorStops: theme.bgGradient
      ? [
          { offset: 0, color: theme.bgAlt },
          { offset: 0.6, color: theme.bg },
          { offset: 1, color: theme.bg },
        ]
      : [{ offset: 0, color: theme.bg }, { offset: 1, color: theme.bg }],
  })
  rect.set("fill", grad)
  return rect
}

// --- TEMPLATE: blank ---
function tplBlank({ fabric, theme, format }: TemplateCtx): any[] {
  return [makeBackground(fabric, theme, format)]
}

// --- TEMPLATE: pre (anuncio antes del partido) ---
function tplPre(ctx: TemplateCtx): any[] {
  const { fabric, theme, format, data } = ctx
  const bg = makeBackground(fabric, theme, format)
  const cx = format.width / 2

  const eyebrow = makeText(fabric, (data?.ligaLabel || "LNB APERTURA 2026").toUpperCase(), {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.04,
    fill: theme.accent,
    charSpacing: 80,
    fontWeight: "bold",
    left: cx, top: format.height * 0.06,
    originX: "center",
    role: "eyebrow",
  })

  const title = makeText(fabric, "PRÓXIMO PARTIDO", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.11,
    fill: theme.fg,
    fontWeight: "900",
    left: cx, top: format.height * 0.11,
    originX: "center",
    role: "title",
  })

  const vs = makeText(fabric, "VS", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.08,
    fill: theme.accent,
    left: cx, top: format.height * 0.45,
    originX: "center",
    originY: "center",
    role: "vs",
  })

  const homeName = makeText(fabric, (data?.homeName || "EQUIPO LOCAL").toUpperCase(), {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.06,
    fill: theme.fg,
    left: format.width * 0.08, top: format.height * 0.58,
    role: "homeName",
  })

  const awayName = makeText(fabric, (data?.awayName || "EQUIPO VISITANTE").toUpperCase(), {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.06,
    fill: theme.fg,
    left: format.width * 0.08, top: format.height * 0.66,
    role: "awayName",
  })

  const infoBar = makeRect(fabric, {
    left: format.width * 0.08,
    top: format.height * 0.78,
    width: format.width * 0.84,
    height: format.height * 0.08,
    fill: theme.bgAlt,
    opacity: 0.7,
    rx: 16, ry: 16,
    role: "infoBar",
  })

  const infoText = makeText(fabric, (data?.dateLabel || "SÁBADO 20:30 HS") + "  ·  " + (data?.venue || "POLIDEPORTIVO"), {
    fontFamily: theme.fontBody,
    fontSize: format.width * 0.028,
    fill: theme.fg,
    left: cx, top: format.height * 0.82,
    originX: "center",
    role: "info",
  })

  return [bg, eyebrow, title, vs, homeName, awayName, infoBar, infoText]
}

// --- TEMPLATE: resultado (con marcador) ---
function tplResultado(ctx: TemplateCtx): any[] {
  const { fabric, theme, format, data } = ctx
  const bg = makeBackground(fabric, theme, format)
  const cx = format.width / 2

  const eyebrow = makeText(fabric, "RESULTADO FINAL", {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.04,
    fill: theme.accent,
    charSpacing: 80, fontWeight: "bold",
    left: cx, top: format.height * 0.07, originX: "center",
    role: "eyebrow",
  })

  const homeName = makeText(fabric, (data?.homeName || "LOCAL").toUpperCase(), {
    fontFamily: theme.fontDisplay, fontSize: format.width * 0.055,
    fill: theme.fg, left: format.width * 0.1, top: format.height * 0.35,
    role: "homeName",
  })
  const homeScore = makeText(fabric, String(data?.homeScore ?? "85"), {
    fontFamily: theme.fontDisplay, fontSize: format.width * 0.22,
    fill: theme.fg, fontWeight: "900",
    left: format.width * 0.1, top: format.height * 0.42,
    role: "homeScore",
  })

  const awayName = makeText(fabric, (data?.awayName || "VISITANTE").toUpperCase(), {
    fontFamily: theme.fontDisplay, fontSize: format.width * 0.055,
    fill: theme.fgMuted, left: format.width * 0.6, top: format.height * 0.35,
    role: "awayName",
  })
  const awayScore = makeText(fabric, String(data?.awayScore ?? "72"), {
    fontFamily: theme.fontDisplay, fontSize: format.width * 0.22,
    fill: theme.fgMuted, fontWeight: "900",
    left: format.width * 0.6, top: format.height * 0.42,
    role: "awayScore",
  })

  const venueText = makeText(fabric, data?.venue || "POLIDEPORTIVO", {
    fontFamily: theme.fontBody, fontSize: format.width * 0.028,
    fill: theme.fgMuted,
    left: cx, top: format.height * 0.82, originX: "center",
    role: "venue",
  })

  return [bg, eyebrow, homeName, homeScore, awayName, awayScore, venueText]
}

// --- TEMPLATE: tabla (posiciones) ---
function tplTabla(ctx: TemplateCtx): any[] {
  const { fabric, theme, format, data } = ctx
  const bg = makeBackground(fabric, theme, format)
  const cx = format.width / 2

  const eyebrow = makeText(fabric, (data?.ligaLabel || "LNB APERTURA 2026").toUpperCase(), {
    fontFamily: theme.fontHeading,
    fontSize: format.width * 0.035,
    fill: theme.accent,
    charSpacing: 80, fontWeight: "bold",
    left: cx, top: format.height * 0.06, originX: "center",
    role: "eyebrow",
  })
  const title = makeText(fabric, "POSICIONES", {
    fontFamily: theme.fontDisplay,
    fontSize: format.width * 0.1, fill: theme.fg,
    left: cx, top: format.height * 0.11, originX: "center",
    role: "title",
  })

  const rows = Array.isArray(data?.standings) ? data.standings.slice(0, 10) : [
    { pos: 1, name: "Olimpia Kings",     pj: 10, w: 9, l: 1 },
    { pos: 2, name: "Ciudad del Este",   pj: 10, w: 8, l: 2 },
    { pos: 3, name: "San José",          pj: 10, w: 7, l: 3 },
    { pos: 4, name: "Félix Pérez Cardozo",pj: 10,w: 6, l: 4 },
    { pos: 5, name: "Colonias Gold",     pj: 10, w: 5, l: 5 },
  ]

  const objs: any[] = [bg, eyebrow, title]
  const startY = format.height * 0.23
  const rowH = format.height * 0.06

  rows.forEach((r: any, i: number) => {
    const y = startY + i * rowH
    const card = makeRect(fabric, {
      left: format.width * 0.08, top: y,
      width: format.width * 0.84, height: rowH * 0.9,
      fill: i % 2 === 0 ? theme.bgAlt : theme.bg,
      opacity: 0.55, rx: 10, ry: 10,
      role: `row-bg-${i}`,
    })
    const pos = makeText(fabric, String(r.pos ?? i + 1), {
      fontFamily: theme.fontDisplay, fontSize: rowH * 0.55,
      fill: theme.accent, left: format.width * 0.11, top: y + rowH * 0.18,
      role: `row-pos-${i}`,
    })
    const name = makeText(fabric, String(r.name || r.teamName || "—").toUpperCase(), {
      fontFamily: theme.fontDisplay, fontSize: rowH * 0.42,
      fill: theme.fg, left: format.width * 0.22, top: y + rowH * 0.25,
      role: `row-name-${i}`,
    })
    const record = makeText(fabric, `${r.w ?? 0}-${r.l ?? 0}`, {
      fontFamily: theme.fontBody, fontSize: rowH * 0.4,
      fill: theme.fgMuted, left: format.width * 0.78, top: y + rowH * 0.28,
      role: `row-record-${i}`,
    })
    objs.push(card, pos, name, record)
  })

  return objs
}

// --- TEMPLATE: lideres ---
function tplLideres(ctx: TemplateCtx): any[] {
  const { fabric, theme, format, data } = ctx
  const bg = makeBackground(fabric, theme, format)
  const cx = format.width / 2

  const eyebrow = makeText(fabric, "LÍDERES DE LA SEMANA", {
    fontFamily: theme.fontHeading, fontSize: format.width * 0.035,
    fill: theme.accent, charSpacing: 80, fontWeight: "bold",
    left: cx, top: format.height * 0.06, originX: "center",
  })
  const title = makeText(fabric, "TOP 5", {
    fontFamily: theme.fontDisplay, fontSize: format.width * 0.16,
    fill: theme.fg,
    left: cx, top: format.height * 0.10, originX: "center",
  })

  const items = Array.isArray(data?.leaders) ? data.leaders.slice(0, 5) : [
    { name: "Juan Pérez",     team: "OLI", value: 28.4 },
    { name: "Luis Martínez",  team: "CDE", value: 24.1 },
    { name: "Diego Gómez",    team: "SJO", value: 22.7 },
    { name: "Pablo Cáceres",  team: "FPC", value: 20.3 },
    { name: "Mario Torres",   team: "COL", value: 19.0 },
  ]

  const objs: any[] = [bg, eyebrow, title]
  const startY = format.height * 0.32
  const rowH = format.height * 0.10

  items.forEach((p: any, i: number) => {
    const y = startY + i * rowH
    const pos = makeText(fabric, String(i + 1), {
      fontFamily: theme.fontDisplay, fontSize: rowH * 0.75,
      fill: theme.accent,
      left: format.width * 0.1, top: y,
      role: `lead-pos-${i}`,
    })
    const name = makeText(fabric, (p.name || "").toUpperCase(), {
      fontFamily: theme.fontDisplay, fontSize: rowH * 0.42,
      fill: theme.fg, left: format.width * 0.22, top: y + rowH * 0.05,
      role: `lead-name-${i}`,
    })
    const team = makeText(fabric, (p.team || "").toUpperCase(), {
      fontFamily: theme.fontBody, fontSize: rowH * 0.3,
      fill: theme.fgMuted, left: format.width * 0.22, top: y + rowH * 0.55,
      role: `lead-team-${i}`,
    })
    const value = makeText(fabric, String(p.value ?? ""), {
      fontFamily: theme.fontDisplay, fontSize: rowH * 0.65,
      fill: theme.fg, left: format.width * 0.78, top: y,
      role: `lead-value-${i}`,
    })
    objs.push(pos, name, team, value)
  })

  return objs
}

// --- TEMPLATE: jugador ---
function tplJugador(ctx: TemplateCtx): any[] {
  const { fabric, theme, format, data } = ctx
  const bg = makeBackground(fabric, theme, format)
  const cx = format.width / 2

  const eyebrow = makeText(fabric, "JUGADOR DEL PARTIDO", {
    fontFamily: theme.fontHeading, fontSize: format.width * 0.04,
    fill: theme.accent, charSpacing: 80, fontWeight: "bold",
    left: cx, top: format.height * 0.06, originX: "center",
  })
  const name = makeText(fabric, (data?.playerName || "NOMBRE JUGADOR").toUpperCase(), {
    fontFamily: theme.fontDisplay, fontSize: format.width * 0.09,
    fill: theme.fg, left: cx, top: format.height * 0.68, originX: "center",
    role: "playerName",
  })
  const team = makeText(fabric, (data?.teamName || "EQUIPO").toUpperCase(), {
    fontFamily: theme.fontHeading, fontSize: format.width * 0.04,
    fill: theme.fgMuted, left: cx, top: format.height * 0.76, originX: "center",
    role: "playerTeam",
  })

  const stats = data?.stats || [
    { label: "PTS", value: "28" },
    { label: "REB", value: "9" },
    { label: "AST", value: "6" },
  ]
  const objs: any[] = [bg, eyebrow, name, team]
  const statsY = format.height * 0.85
  const colW = format.width / (stats.length + 1)
  stats.forEach((s: any, i: number) => {
    const x = colW * (i + 1)
    const value = makeText(fabric, String(s.value), {
      fontFamily: theme.fontDisplay, fontSize: format.width * 0.07,
      fill: theme.accent, left: x, top: statsY, originX: "center",
      role: `stat-value-${i}`,
    })
    const label = makeText(fabric, s.label, {
      fontFamily: theme.fontHeading, fontSize: format.width * 0.028,
      fill: theme.fgMuted, left: x, top: statsY + format.width * 0.085,
      originX: "center", charSpacing: 80,
      role: `stat-label-${i}`,
    })
    objs.push(value, label)
  })

  return objs
}

// --- TEMPLATE: lanzamiento ---
function tplLanzamiento(ctx: TemplateCtx): any[] {
  const { fabric, theme, format } = ctx
  const bg = makeBackground(fabric, theme, format)
  const cx = format.width / 2
  const cy = format.height / 2

  const eyebrow = makeText(fabric, "ARRANCA LA TEMPORADA", {
    fontFamily: theme.fontHeading, fontSize: format.width * 0.04,
    fill: theme.accent, charSpacing: 100, fontWeight: "bold",
    left: cx, top: cy - format.width * 0.22, originX: "center",
    role: "eyebrow",
  })
  const title = makeText(fabric, "APERTURA 2026", {
    fontFamily: theme.fontDisplay, fontSize: format.width * 0.16,
    fill: theme.fg, fontWeight: "900",
    left: cx, top: cy - format.width * 0.08, originX: "center",
    role: "title",
  })
  const date = makeText(fabric, "13 DE ABRIL", {
    fontFamily: theme.fontDisplay, fontSize: format.width * 0.08,
    fill: theme.accent,
    left: cx, top: cy + format.width * 0.05, originX: "center",
    role: "date",
  })
  const sub = makeText(fabric, "Seguí todos los partidos en vivo", {
    fontFamily: theme.fontBody, fontSize: format.width * 0.032,
    fill: theme.fgMuted,
    left: cx, top: cy + format.width * 0.17, originX: "center",
    role: "sub",
  })

  return [bg, eyebrow, title, date, sub]
}

export function buildTemplate(key: TemplateKey, ctx: TemplateCtx): any[] {
  switch (key) {
    case "pre": return tplPre(ctx)
    case "resultado": return tplResultado(ctx)
    case "tabla": return tplTabla(ctx)
    case "lideres": return tplLideres(ctx)
    case "jugador": return tplJugador(ctx)
    case "lanzamiento": return tplLanzamiento(ctx)
    case "blank":
    default: return tplBlank(ctx)
  }
}
