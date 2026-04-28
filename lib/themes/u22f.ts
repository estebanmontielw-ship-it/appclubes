// Tokens del tema U22 Femenino — Paraguay (azul profundo + rojo) con
// detalle sutil rosa solo en chips/eyebrow para diferenciar género.
// Paralelo a lib/themes/u22m.ts — la paleta país se mantiene; el rosa
// (--f-accent-soft) se usa SOLO en `accentSoft` (labels de meta, badge
// de "JUEGO N", borde del divider). El acento principal sigue siendo
// rojo Paraguay para preservar identidad país.

export const U22F = {
  color: {
    // Azul Paraguay (escala 950 → 300) — idéntica a U22M
    blue950: "#0A1230",
    blue900: "#0F1A48",
    blue800: "#15246B",
    blue700: "#1E3399",
    blue600: "#2A4DC2",
    blue500: "#3F66E0",
    blue400: "#5A83F2",
    blue300: "#A8BCF5",
    // Rojo Paraguay
    red700: "#8C1626",
    red600: "#B61E2E",
    red500: "#D62A3F",
    red400: "#EE4155",
    // Paper / off-whites
    paper100: "#FFFFFF",
    paper200: "#F4F2EC",
    paper300: "#E6E2D6",
    // Acento femenino sutil — solo para detalles (eyebrows, dots)
    fAccentSoft: "#D946A0",
    fAccentSoftDim: "#F4A8D6",
    // Text
    cream: "#F4F2EC",
    white: "#FFFFFF",
  },
  font: {
    display: "Archivo Black",
    heading: "Bebas Neue",
    body:    "Inter",
  },
  radius: { sm: 8, md: 12, lg: 20, xl: 22 },
  bgHero: "linear-gradient(160deg, #1E3399 0%, #15246B 38%, #0F1A48 70%, #0A1230 100%)",
  glowBlueRadial: "radial-gradient(circle, rgba(63,102,224,0.45) 0%, rgba(63,102,224,0) 65%)",
  glowRedRadial:  "radial-gradient(circle, rgba(214,42,63,0.28) 0%, rgba(214,42,63,0) 65%)",
  glowPinkRadial: "radial-gradient(circle, rgba(217,70,160,0.22) 0%, rgba(217,70,160,0) 65%)",
} as const

export const U22F_TC = {
  title:    U22F.color.white,
  subtitle: U22F.color.fAccentSoftDim,
  team:     U22F.color.white,
  venue:    "rgba(244,242,236,0.78)",
  dot:      "rgba(255,255,255,0.3)",
  time:     U22F.color.white,
  score:    U22F.color.white,
  scoreDim: "rgba(255,255,255,0.3)",
  infoBg:   "rgba(10,18,48,0.62)",
  default:  "rgba(255,255,255,0.25)",
  accent:   U22F.color.red600,
} as const
