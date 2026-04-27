import { U22M } from "@/lib/themes/u22m"
import { U22F } from "@/lib/themes/u22f"

// Fondos U22 Paraguay. Paralelos a lnb-backgrounds / lnbf-backgrounds.
// Variantes "formales" con identidad país: azul Paraguay + rojo +
// detalles paper. La variante "bandera" recrea la composición triangular
// (azul abajo-izq + rojo abajo-der + paper centro) del fondo alternativo
// que diseñó Esteban en Claude Design.
//
// Todas las posiciones se generan con un LCG determinístico (mismo
// truco que lnb-backgrounds) para que el cache de satori sea estable.

function dotsDataUrl(color: string, opacity: number): string {
  let seed = 11
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  const circles: string[] = []
  for (let i = 0; i < 200; i++) {
    const x = rnd() * 1080
    const y = rnd() * 1920
    const r = (1 + rnd() * 2.2).toFixed(2)
    circles.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${color}" opacity="${opacity.toFixed(3)}"/>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">${circles.join("")}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function paperGrainDataUrl(opacity: number): string {
  // Grain papel cálido — micro puntos color crema baja opacidad.
  let seed = 23
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  const dots: string[] = []
  for (let i = 0; i < 600; i++) {
    const x = (rnd() * 1080).toFixed(1)
    const y = (rnd() * 1920).toFixed(1)
    const r = (rnd() * 0.9 + 0.4).toFixed(2)
    const op = (opacity * (0.4 + rnd() * 0.6)).toFixed(3)
    dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#F4F2EC" opacity="${op}"/>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">${dots.join("")}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function stripesDataUrl(color: string, opacity: number): string {
  // Rayas diagonales formales — tipo papel oficial / bandera estilizada.
  const lines: string[] = []
  for (let i = -30; i < 80; i++) {
    const x = i * 36
    const op = ((i % 4 === 0 ? 1 : 0.45) * opacity).toFixed(3)
    lines.push(`<line x1="${x}" y1="0" x2="${x + 600}" y2="1920" stroke="${color}" stroke-width="1.2" opacity="${op}"/>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">${lines.join("")}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function courtLinesDataUrl(color: string, opacity: number): string {
  const stroke = color
  const opHigh = (opacity * 1.4).toFixed(3)
  const opLow  = (opacity * 0.6).toFixed(3)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">` +
    `<path d="M -100 1800 Q 540 900 1180 1800" stroke="${stroke}" stroke-width="3" fill="none" opacity="${opHigh}"/>` +
    `<path d="M -100 1960 Q 540 1080 1180 1960" stroke="${stroke}" stroke-width="2" fill="none" opacity="${opLow}"/>` +
    `<rect x="390" y="1550" width="300" height="350" stroke="${stroke}" stroke-width="3" fill="none" opacity="${opHigh}"/>` +
    `<circle cx="540" cy="1550" r="120" stroke="${stroke}" stroke-width="3" fill="none" opacity="${opHigh}"/>` +
    `<path d="M -100 -150 Q 540 700 1180 -150" stroke="${stroke}" stroke-width="2" fill="none" opacity="${opLow}"/>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// "Bandera" — composición triangular Paraguay tipo flyer formal.
// Triángulo paper centrado (V invertida) + cuñas azul abajo-izq y
// roja abajo-der + destellos en cada esquina baja. Inspirado en el
// fondo alternativo que diseñó Esteban en Claude Design.
function banderaDataUrl(): string {
  // Coordenadas viewBox 1080×1920. La V de paper baja desde (0,0) y
  // (1080,0) hacia un punto en la base (~540, 1920). Las cuñas
  // tricolor ocupan los costados inferiores.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">` +
    // Cuña azul abajo-izquierda
    `<polygon points="0,1500 0,1920 540,1920 90,1620" fill="#1E3399"/>` +
    // Cuña roja abajo-derecha
    `<polygon points="1080,1500 1080,1920 540,1920 990,1620" fill="#B61E2E"/>` +
    // Triángulo paper central (encima de las cuñas)
    `<polygon points="0,0 1080,0 1080,1480 540,1900 0,1480" fill="#F4F2EC"/>` +
    // Borde diagonal entre paper y cuña azul (sombra sutil)
    `<line x1="0" y1="1480" x2="540" y2="1900" stroke="rgba(0,0,0,0.18)" stroke-width="2"/>` +
    `<line x1="540" y1="1900" x2="1080" y2="1480" stroke="rgba(0,0,0,0.18)" stroke-width="2"/>` +
    // Destello sobre la cuña azul
    `<circle cx="120" cy="1740" r="42" fill="rgba(255,255,255,0.85)"/>` +
    `<circle cx="120" cy="1740" r="90" fill="rgba(255,255,255,0.18)"/>` +
    // Destello sobre la cuña roja
    `<circle cx="960" cy="1740" r="42" fill="rgba(255,255,255,0.85)"/>` +
    `<circle cx="960" cy="1740" r="90" fill="rgba(255,255,255,0.18)"/>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export type U22Variant = "clean" | "dots" | "stripes" | "court" | "bandera" | "paper"

function U22BackgroundBase({
  theme,
  variant = "clean",
  W,
  H,
}: {
  theme: typeof U22M | typeof U22F
  variant?: U22Variant
  W: number
  H: number
}) {
  const fill: React.CSSProperties = {
    display: "flex", position: "absolute", top: 0, left: 0, width: W, height: H,
  }

  // La variante "bandera" sobreescribe el fondo: en lugar del gradient
  // azul, dibujamos el SVG triangular Paraguay con paper claro central.
  if (variant === "bandera") {
    return (
      <div style={{ ...fill }}>
        <img src={banderaDataUrl()} width={W} height={H} style={{ ...fill, objectFit: "cover" }} alt="" />
      </div>
    )
  }

  // La variante "paper" usa fondo crema con texto oscuro — útil para
  // variantes editoriales formales. Genera un gradient paper + grain.
  if (variant === "paper") {
    return (
      <div style={{ ...fill }}>
        <div style={{ ...fill, background: "linear-gradient(180deg, #FFFFFF 0%, #F4F2EC 60%, #E6E2D6 100%)" }} />
        <img src={paperGrainDataUrl(0.18)} width={W} height={H} style={{ ...fill }} alt="" />
        {/* Cuña azul abajo-izquierda apenas asomando */}
        <div style={{ ...fill, background: theme.glowBlueRadial, top: H - 600, left: -260, width: 700, height: 700 }} />
        {/* Cuña roja abajo-derecha apenas asomando */}
        <div style={{ ...fill, background: theme.glowRedRadial, top: H - 600, left: W - 440, width: 700, height: 700 }} />
      </div>
    )
  }

  // Variantes "dark" (default) — base azul Paraguay + glows + overlay
  return (
    <div style={{ ...fill }}>
      {/* Base */}
      <div style={{ ...fill, background: theme.bgHero }} />
      {/* Glow azul top */}
      <div style={{
        display: "flex", position: "absolute",
        top: -300, left: W * 0.1, width: W * 0.9, height: W * 0.9,
        background: theme.glowBlueRadial,
      }} />
      {/* Glow rojo bottom-right (acento Paraguay) */}
      <div style={{
        display: "flex", position: "absolute",
        bottom: -220, right: -220, width: 700, height: 700,
        background: theme.glowRedRadial,
      }} />
      {/* Pattern overlays */}
      {variant === "dots" && (
        <img src={dotsDataUrl(U22M.color.blue300, 0.14)} width={W} height={H} style={{ ...fill }} alt="" />
      )}
      {variant === "stripes" && (
        <img src={stripesDataUrl(U22M.color.blue400, 0.14)} width={W} height={H} style={{ ...fill }} alt="" />
      )}
      {variant === "court" && (
        <img src={courtLinesDataUrl(U22M.color.blue300, 0.10)} width={W} height={H} style={{ ...fill }} alt="" />
      )}
      {/* variant === "clean" → sin overlay extra */}
    </div>
  )
}

// Wrappers separados para mantener simetría con LNBBackground/LNBFBackground.
// Internamente comparten la misma implementación porque U22M y U22F
// usan idéntica paleta de fondo (la diferencia femenina vive en
// accentSoft de la palette de las cards, no en el bg).
export function U22MBackground({ variant = "clean", W, H }: { variant?: U22Variant; W: number; H: number }) {
  return <U22BackgroundBase theme={U22M} variant={variant} W={W} H={H} />
}

export function U22FBackground({ variant = "clean", W, H }: { variant?: U22Variant; W: number; H: number }) {
  return <U22BackgroundBase theme={U22F} variant={variant} W={W} H={H} />
}
