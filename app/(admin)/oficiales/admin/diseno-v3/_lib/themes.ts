// Paletas pre-armadas para cada liga. Se usan como defaults al abrir el
// editor y se aplican a los templates al insertarlos. Se pueden pisar
// individualmente editando cada elemento.
//
// Los colores base salen de /lib/themes/lnb.ts y /lib/themes/lnbf.ts,
// pero acá los re-declaramos con la forma que usa la V3 (paleta simple
// bg/fg/accent/muted) para no acoplarnos al renderer satori del V2.

export type LigaKey = "lnb" | "lnbf" | "u22m" | "u22f"

export interface V3Theme {
  key: string
  label: string
  liga: LigaKey
  // Colores principales
  bg: string          // fondo primario
  bgAlt: string       // fondo secundario (tarjetas)
  fg: string          // texto principal
  fgMuted: string     // texto secundario
  accent: string      // color de marca (gold LNB, magenta LNBF, etc.)
  accentAlt: string   // acento secundario
  danger: string
  // Gradiente opcional de fondo
  bgGradient?: string
  // Tipografías sugeridas
  fontDisplay: string
  fontHeading: string
  fontBody: string
}

export const THEMES: Record<string, V3Theme> = {
  "lnb-navy": {
    key: "lnb-navy",
    label: "LNB · Navy",
    liga: "lnb",
    bg: "#03081A",
    bgAlt: "#0E1D4F",
    fg: "#F2F5FF",
    fgMuted: "#A6BEFF",
    accent: "#D4AF37",
    accentAlt: "#2D56D4",
    danger: "#C8261F",
    bgGradient: "linear-gradient(160deg, #1E3FA8 0%, #0E1D4F 38%, #081233 70%, #03081A 100%)",
    fontDisplay: "Archivo Black",
    fontHeading: "Bebas Neue",
    fontBody: "Inter",
  },
  "lnbf-magenta": {
    key: "lnbf-magenta",
    label: "LNBF · Magenta",
    liga: "lnbf",
    bg: "#1A0414",
    bgAlt: "#3F0A36",
    fg: "#FFF2FB",
    fgMuted: "#F2B8DC",
    accent: "#FF4EA7",
    accentAlt: "#8C2A6B",
    danger: "#FF3D57",
    bgGradient: "linear-gradient(160deg, #8C2A6B 0%, #3F0A36 40%, #1A0414 100%)",
    fontDisplay: "Archivo Black",
    fontHeading: "Bebas Neue",
    fontBody: "Inter",
  },
  "u22m-electric": {
    key: "u22m-electric",
    label: "U22 Masc · Eléctrico",
    liga: "u22m",
    bg: "#040B1F",
    bgAlt: "#0B1B4D",
    fg: "#EAF2FF",
    fgMuted: "#7FA6FF",
    accent: "#00E5FF",
    accentAlt: "#4D66FF",
    danger: "#FF4D6D",
    bgGradient: "linear-gradient(160deg, #4D66FF 0%, #0B1B4D 40%, #040B1F 100%)",
    fontDisplay: "Archivo Black",
    fontHeading: "Bebas Neue",
    fontBody: "Inter",
  },
  "u22f-coral": {
    key: "u22f-coral",
    label: "U22 Fem · Coral",
    liga: "u22f",
    bg: "#1B0411",
    bgAlt: "#4A0D2C",
    fg: "#FFF0F3",
    fgMuted: "#FFB3C7",
    accent: "#FF5A7E",
    accentAlt: "#A3184F",
    danger: "#FF3D57",
    bgGradient: "linear-gradient(160deg, #A3184F 0%, #4A0D2C 40%, #1B0411 100%)",
    fontDisplay: "Archivo Black",
    fontHeading: "Bebas Neue",
    fontBody: "Inter",
  },
  "clean-light": {
    key: "clean-light",
    label: "Clean Light",
    liga: "lnb",
    bg: "#F7F8FC",
    bgAlt: "#FFFFFF",
    fg: "#0A0F2C",
    fgMuted: "#5A6184",
    accent: "#2D56D4",
    accentAlt: "#D4AF37",
    danger: "#C8261F",
    fontDisplay: "Archivo Black",
    fontHeading: "Bebas Neue",
    fontBody: "Inter",
  },
}

export function getDefaultTheme(liga: LigaKey): V3Theme {
  if (liga === "lnbf") return THEMES["lnbf-magenta"]
  if (liga === "u22m") return THEMES["u22m-electric"]
  if (liga === "u22f") return THEMES["u22f-coral"]
  return THEMES["lnb-navy"]
}

export function themesForLiga(liga: LigaKey): V3Theme[] {
  return Object.values(THEMES).filter((t) => t.liga === liga || t.key === "clean-light")
}
