import { LNB } from "@/lib/themes/lnb"

// Fondos LNB Premium (Masculino). Adaptados del handoff de Claude Design
// (/design-handoff/lnb/placeholders.jsx) a la forma que satori entiende
// bien: cada overlay es un SVG inline vía data-URL. Las posiciones de
// puntos/líneas están pre-calculadas para que no cambien entre renders
// (satori cachea por URL y Math.random ensucia el hash).

function scratchDataUrl(color: string, opacity: number): string {
  // 80 líneas finas en ángulos random, estilo flyers oficiales LNB.
  // Pre-calculadas con un LCG determinístico (seed=13) para cache estable.
  let seed = 13
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  const lines: string[] = []
  for (let i = 0; i < 80; i++) {
    const x1 = rnd() * 1080
    const y1 = rnd() * 1920
    const angle = rnd() * Math.PI * 2
    const len = 60 + rnd() * 220
    const x2 = x1 + Math.cos(angle) * len
    const y2 = y1 + Math.sin(angle) * len
    const o = (0.3 + rnd() * 0.7) * opacity
    lines.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="0.8" opacity="${o.toFixed(3)}"/>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">${lines.join("")}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function dotsDataUrl(color: string, opacity: number): string {
  // Constelación tipo grain — más densa que la de LNBF.
  let seed = 7
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  const circles: string[] = []
  for (let i = 0; i < 220; i++) {
    const x = rnd() * 1080
    const y = rnd() * 1920
    const r = (1 + rnd() * 2.2).toFixed(2)
    circles.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${color}" opacity="${opacity.toFixed(3)}"/>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">${circles.join("")}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function courtLinesDataUrl(color: string, opacity: number): string {
  // Líneas de cancha estilizadas, como las de los flyers LNB oficiales
  const stroke = color
  const opHigh = (opacity * 1.4).toFixed(3)
  const opLow  = (opacity * 0.6).toFixed(3)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">` +
    // arco inferior (centro de cancha lejano)
    `<path d="M -100 1800 Q 540 900 1180 1800" stroke="${stroke}" stroke-width="3" fill="none" opacity="${opHigh}"/>` +
    `<path d="M -100 1960 Q 540 1080 1180 1960" stroke="${stroke}" stroke-width="2" fill="none" opacity="${opLow}"/>` +
    // paint box
    `<rect x="390" y="1550" width="300" height="350" stroke="${stroke}" stroke-width="3" fill="none" opacity="${opHigh}"/>` +
    `<circle cx="540" cy="1550" r="120" stroke="${stroke}" stroke-width="3" fill="none" opacity="${opHigh}"/>` +
    // arco superior (perspectiva invertida)
    `<path d="M -100 -150 Q 540 700 1180 -150" stroke="${stroke}" stroke-width="2" fill="none" opacity="${opLow}"/>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function halftoneDataUrl(color: string, opacity: number): string {
  // Halftone: dots cuyo radio varía según distancia al centro (top)
  const cols = 36, rows = 64
  const dots: string[] = []
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = (c + 0.5) * (1080 / cols)
      const y = (r + 0.5) * (1920 / rows)
      const d = Math.hypot(x - 540, y - 500)
      const size = Math.max(0, 4 - d / 260)
      if (size > 0.4) {
        const op = (opacity * (size / 4)).toFixed(3)
        dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(2)}" fill="${color}" opacity="${op}"/>`)
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">${dots.join("")}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function speedLinesDataUrl(color: string, opacity: number): string {
  // Diagonales de "velocidad" — dan sensación de movimiento
  const lines: string[] = []
  for (let i = -20; i < 60; i++) {
    const x = i * 40
    const op = ((i % 3 === 0 ? 1 : 0.4) * opacity).toFixed(3)
    lines.push(`<line x1="${x}" y1="0" x2="${x - 400}" y2="1920" stroke="${color}" stroke-width="1.5" opacity="${op}"/>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">${lines.join("")}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export type LNBVariant = "clean" | "scratch" | "dots" | "court" | "halftone" | "speed"

export function LNBBackground({
  variant = "scratch",
  W,
  H,
}: {
  variant?: LNBVariant
  W: number
  H: number
}) {
  const blue = LNB.color.softBlue
  const fill: React.CSSProperties = {
    display: "flex", position: "absolute", top: 0, left: 0, width: W, height: H,
  }
  return (
    <div style={{ ...fill }}>
      {/* Base */}
      <div style={{ ...fill, background: LNB.bgHero }} />
      {/* Glow azul top */}
      <div style={{
        display: "flex", position: "absolute",
        top: -300, left: W * 0.1, width: W * 0.9, height: W * 0.9,
        background: LNB.glowBlueRadial,
      }} />
      {/* Glow gold bottom-right (sutil) */}
      <div style={{
        display: "flex", position: "absolute",
        bottom: -220, right: -220, width: 700, height: 700,
        background: LNB.glowGoldRadial,
      }} />
      {/* Pattern overlays */}
      {variant === "scratch" && (
        <img src={scratchDataUrl(blue, 0.10)} width={W} height={H} style={{ ...fill }} alt="" />
      )}
      {variant === "dots" && (
        <img src={dotsDataUrl(blue, 0.14)} width={W} height={H} style={{ ...fill }} alt="" />
      )}
      {variant === "court" && (
        <img src={courtLinesDataUrl(blue, 0.10)} width={W} height={H} style={{ ...fill }} alt="" />
      )}
      {variant === "halftone" && (
        <img src={halftoneDataUrl("#FFFFFF", 0.12)} width={W} height={H} style={{ ...fill }} alt="" />
      )}
      {variant === "speed" && (
        <img src={speedLinesDataUrl(LNB.color.blue400, 0.16)} width={W} height={H} style={{ ...fill }} alt="" />
      )}
      {/* variant === "clean" → sin overlay */}
    </div>
  )
}
