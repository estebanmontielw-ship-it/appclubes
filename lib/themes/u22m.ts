// Tokens del tema U22 Masculino — Paraguay (azul profundo + rojo como acento).
// Paralelo a lib/themes/lnb.ts pero con paleta país (sin gold).
// Se usan inline en el flyer-v2 (satori no soporta className).

export const U22M = {
  color: {
    // Azul Paraguay (escala 950 → 300)
    blue950: "#0A1230",
    blue900: "#0F1A48",
    blue800: "#15246B",
    blue700: "#1E3399",  // azul Paraguay principal
    blue600: "#2A4DC2",
    blue500: "#3F66E0",
    blue400: "#5A83F2",
    blue300: "#A8BCF5",
    // Rojo Paraguay (acento principal — reemplaza al gold de LNB)
    red700: "#8C1626",
    red600: "#B61E2E",   // rojo principal
    red500: "#D62A3F",
    red400: "#EE4155",
    // Paper / off-whites para texto y detalles claros
    paper100: "#FFFFFF",
    paper200: "#F4F2EC",
    paper300: "#E6E2D6",
    // Text
    cream: "#F4F2EC",
    white: "#FFFFFF",
  },
  font: {
    display: "Archivo Black", // hero + scores
    heading: "Bebas Neue",    // eyebrows + labels (Anton también está disponible vía Inter Black fallback)
    body:    "Inter",         // UI general
  },
  radius: { sm: 8, md: 12, lg: 18, xl: 22 },
  // Hero gradient — azul Paraguay profundo. Linear es el más estable en satori.
  bgHero: "linear-gradient(160deg, #1E3399 0%, #15246B 38%, #0F1A48 70%, #0A1230 100%)",
  // Glows radiales circulares (satori sí soporta circle)
  glowBlueRadial: "radial-gradient(circle, rgba(63,102,224,0.45) 0%, rgba(63,102,224,0) 65%)",
  glowRedRadial:  "radial-gradient(circle, rgba(214,42,63,0.30) 0%, rgba(214,42,63,0) 65%)",
  glowPaperRadial:"radial-gradient(circle, rgba(244,242,236,0.18) 0%, rgba(244,242,236,0) 65%)",
} as const

// Paleta de texto cuando theme === "u22m-premium". Misma forma que tc.
export const U22M_TC = {
  title:    U22M.color.white,
  subtitle: U22M.color.blue300,
  team:     U22M.color.white,
  venue:    "rgba(244,242,236,0.78)",
  dot:      "rgba(255,255,255,0.3)",
  time:     U22M.color.white,
  score:    U22M.color.white,
  scoreDim: "rgba(255,255,255,0.3)",
  infoBg:   "rgba(10,18,48,0.62)",
  default:  "rgba(255,255,255,0.25)",
  accent:   U22M.color.red600,
} as const
