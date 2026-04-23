// Patrones de fondo para templates V3 — portados del V2 (lib/flyer/*-backgrounds).
// Cada patrón se define como SVG string pequeño y se usa como fill pattern en
// fabric.js (se carga async una vez y se aplica a un Rect overlay transparente).
//
// El color primario del patrón es parametrizable (se reemplaza {c} en el SVG).

export type PatternKey =
  | "none"
  | "dots"
  | "scratch"
  | "court"
  | "halftone"
  | "nandu"
  | "speed"

export interface PatternMeta {
  key: PatternKey
  label: string
  tileSize: number   // px del tile SVG
  svg: (color: string, alpha: number) => string
}

function enc(s: string) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(s)
}

export const PATTERNS: Record<PatternKey, PatternMeta> = {
  none: {
    key: "none", label: "Sin patrón", tileSize: 0,
    svg: () => "",
  },

  dots: {
    key: "dots", label: "Puntos", tileSize: 40,
    svg: (c, a) => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="1.8" fill="${c}" fill-opacity="${a}"/>
    </svg>`,
  },

  scratch: {
    key: "scratch", label: "Scratch", tileSize: 60,
    svg: (c, a) => `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
      <path d="M-5 35 L35 -5 M10 50 L50 10 M25 65 L65 25" stroke="${c}" stroke-opacity="${a}" stroke-width="1"/>
    </svg>`,
  },

  court: {
    key: "court", label: "Cancha", tileSize: 200,
    svg: (c, a) => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <g stroke="${c}" stroke-opacity="${a}" fill="none" stroke-width="1">
        <rect x="10" y="10" width="180" height="180"/>
        <circle cx="100" cy="100" r="30"/>
        <line x1="10" y1="100" x2="190" y2="100"/>
        <rect x="70" y="10" width="60" height="50"/>
        <rect x="70" y="140" width="60" height="50"/>
      </g>
    </svg>`,
  },

  halftone: {
    key: "halftone", label: "Halftone", tileSize: 80,
    svg: (c, a) => `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <circle cx="10" cy="10" r="1"   fill="${c}" fill-opacity="${a * 1.2}"/>
      <circle cx="30" cy="10" r="1.5" fill="${c}" fill-opacity="${a * 1.1}"/>
      <circle cx="50" cy="10" r="2"   fill="${c}" fill-opacity="${a}"/>
      <circle cx="70" cy="10" r="2.5" fill="${c}" fill-opacity="${a * 0.9}"/>
      <circle cx="10" cy="40" r="1.5" fill="${c}" fill-opacity="${a * 1.1}"/>
      <circle cx="30" cy="40" r="2"   fill="${c}" fill-opacity="${a}"/>
      <circle cx="50" cy="40" r="2.5" fill="${c}" fill-opacity="${a * 0.9}"/>
      <circle cx="70" cy="40" r="3"   fill="${c}" fill-opacity="${a * 0.8}"/>
      <circle cx="10" cy="70" r="2"   fill="${c}" fill-opacity="${a}"/>
      <circle cx="30" cy="70" r="2.5" fill="${c}" fill-opacity="${a * 0.9}"/>
      <circle cx="50" cy="70" r="3"   fill="${c}" fill-opacity="${a * 0.8}"/>
      <circle cx="70" cy="70" r="3.5" fill="${c}" fill-opacity="${a * 0.7}"/>
    </svg>`,
  },

  nandu: {
    key: "nandu", label: "Ñandutí", tileSize: 120,
    svg: (c, a) => `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <g stroke="${c}" stroke-opacity="${a}" fill="none" stroke-width="0.8">
        <circle cx="60" cy="60" r="50"/>
        <circle cx="60" cy="60" r="35"/>
        <circle cx="60" cy="60" r="20"/>
        <line x1="10" y1="60" x2="110" y2="60"/>
        <line x1="60" y1="10" x2="60" y2="110"/>
        <line x1="25" y1="25" x2="95" y2="95"/>
        <line x1="95" y1="25" x2="25" y2="95"/>
      </g>
      <circle cx="60" cy="60" r="2" fill="${c}" fill-opacity="${a * 1.5}"/>
    </svg>`,
  },

  speed: {
    key: "speed", label: "Velocidad", tileSize: 100,
    svg: (c, a) => `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <g stroke="${c}" stroke-opacity="${a}" stroke-width="1.4">
        <line x1="0"  y1="20" x2="40" y2="20"/>
        <line x1="50" y1="45" x2="100" y2="45"/>
        <line x1="10" y1="70" x2="55" y2="70"/>
        <line x1="65" y1="90" x2="100" y2="90"/>
      </g>
    </svg>`,
  },
}

// Data URL para usar como <img src>
export function patternDataUrl(key: PatternKey, color = "#FFFFFF", alpha = 0.08): string {
  const p = PATTERNS[key]
  if (!p || key === "none") return ""
  return enc(p.svg(color, alpha))
}

export const PATTERN_LIST: PatternKey[] = ["none", "dots", "scratch", "halftone", "court", "nandu", "speed"]
