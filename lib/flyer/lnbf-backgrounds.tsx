import { LNBF } from "@/lib/themes/lnbf"

// Fondos para el tema LNBF Premium. Se usan adentro de ImageResponse
// (satori), por eso cada <div> que envuelve texto/svg lleva display:
// "flex", y los SVG se inyectan vía data-URL (forma más estable) en
// vez de <svg> directo (que satori soporta parcialmente según versión).
//
// Las posiciones de los puntos en el variant "dots" están pre-calculadas
// para que no cambien entre requests — satori evalúa cada render como
// puro y Math.random ensucia el output.

function courtLinesDataUrl(gold: string): string {
  // Contorno de cancha + círculo central en gold tenue
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">` +
    `<g fill="none" stroke="${gold}" stroke-width="2" opacity="0.10">` +
    `<rect x="60" y="60" width="960" height="1800" rx="30"/>` +
    `<circle cx="540" cy="960" r="90"/>` +
    `<circle cx="540" cy="960" r="200"/>` +
    `<line x1="60" y1="960" x2="1020" y2="960"/>` +
    `<rect x="340" y="60" width="400" height="320"/>` +
    `<rect x="340" y="1540" width="400" height="320"/>` +
    `</g></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function dotsDataUrl(gold: string): string {
  // Constelación de ~24 puntos, tamaños variados — pre-calculados
  const pts = [
    [120, 200, 4], [450, 340, 3], [780, 180, 5], [210, 520, 3],
    [900, 600, 4], [340, 800, 3], [680, 1040, 4], [140, 1200, 3],
    [520, 1380, 5], [920, 1540, 3], [360, 1680, 4], [160, 1820, 3],
    [720, 1880, 4], [480, 780, 3], [840, 360, 4], [80, 700, 3],
    [260, 1100, 4], [620, 1460, 3], [980, 280, 4], [40, 1400, 3],
    [600, 220, 3], [280, 340, 4], [820, 920, 3], [160, 960, 4],
  ]
  const circles = pts.map(([x, y, r]) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${gold}" opacity="0.30"/>`
  ).join("")
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">` +
    circles + `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function nanduRhombusDataUrl(accent: string): string {
  // Patrón ñandutí muy sutil: rombos en rejilla cada 180px
  const rhombus = (x: number, y: number) =>
    `<g transform="translate(${x},${y}) rotate(45)"><rect x="-16" y="-16" width="32" height="32" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.12"/></g>`
  const grid: string[] = []
  for (let y = 120; y < 1920; y += 180) {
    for (let x = 120; x < 1080; x += 180) {
      grid.push(rhombus(x, y))
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">` +
    grid.join("") + `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

type Variant = "court" | "dots" | "nandu" | "clean"

export function LNBFBackground({
  variant = "clean",
  W,
  H,
}: {
  variant?: Variant
  W: number
  H: number
}) {
  const gold = LNBF.color.gold500
  const accent = LNBF.color.violet400
  const fill: React.CSSProperties = {
    display: "flex", position: "absolute", top: 0, left: 0, width: W, height: H,
  }
  return (
    <div style={{ ...fill }}>
      {/* Base — linear diagonal porque satori es más estable que radial ellipse */}
      <div style={{ ...fill, background: LNBF.bgHero }} />
      {/* Glow violeta arriba-izquierda */}
      <div style={{
        display: "flex", position: "absolute",
        top: -220, left: -220, width: 900, height: 900,
        background: LNBF.glowVioletRadial,
      }} />
      {/* Glow gold abajo-derecha (más sutil) */}
      <div style={{
        display: "flex", position: "absolute",
        bottom: -220, right: -220, width: 700, height: 700,
        background: LNBF.glowGoldRadial,
      }} />
      {/* Pattern overlay */}
      {variant === "court" && (
        <img src={courtLinesDataUrl(gold)} width={W} height={H} style={{ ...fill, opacity: 0.55 }} alt="" />
      )}
      {variant === "dots" && (
        <img src={dotsDataUrl(gold)} width={W} height={H} style={{ ...fill, opacity: 0.65 }} alt="" />
      )}
      {variant === "nandu" && (
        <img src={nanduRhombusDataUrl(accent)} width={W} height={H} style={{ ...fill, opacity: 0.5 }} alt="" />
      )}
      {/* variant === "clean" → sin overlay, solo base + glows */}
    </div>
  )
}
