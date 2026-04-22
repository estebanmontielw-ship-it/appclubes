// Tokens del tema LNBF Premium — morado profundo + gold.
// Se usan inline en los flyers (satori no soporta className) pero
// centralizar acá evita drift entre templates.

export const LNBF = {
  color: {
    violet950: "#0E0418",
    violet900: "#1A0A2E",
    violet800: "#2B0E4D",
    violet700: "#3C1370",
    violet600: "#5A1FA3",
    violet500: "#7B2CDE",
    violet400: "#A45AFF",
    violet300: "#C9A0FF",
    gold500:   "#FFC857",
    gold400:   "#FFD985",
    red500:    "#E63946",
    azure500:  "#4361EE",
    cream:     "#FAF5FF",
    white:     "#FFFFFF",
  },
  font: {
    display: "Archivo Black", // hero + scores
    heading: "Bebas Neue",    // eyebrows + labels
    body:    "Inter",         // UI general
  },
  radius: { sm: 8, md: 16, lg: 20, xl: 28 },
  // Gradient del fondo hero. Linear es el más estable en satori — radial
  // con "ellipse" suele fallar, nos quedamos con linear diagonal que
  // simula bien el "vignette" desde top-center.
  bgHero: "linear-gradient(160deg, #3C1370 0%, #2B0E4D 35%, #1A0A2E 70%, #0E0418 100%)",
  // Radial simple (circle) para glows suaves en esquinas — sí lo soporta satori.
  glowVioletRadial: "radial-gradient(circle, rgba(123,44,222,0.45) 0%, rgba(123,44,222,0) 65%)",
  glowGoldRadial:   "radial-gradient(circle, rgba(255,200,87,0.25) 0%, rgba(255,200,87,0) 65%)",
} as const

// Paleta de texto para cuando theme === "lnbf-premium". Mantiene la
// misma forma que el objeto `tc` actual para que los componentes la
// consuman sin cambios.
export const LNBF_TC = {
  title:    LNBF.color.white,
  subtitle: LNBF.color.violet300,
  team:     LNBF.color.white,
  venue:    "rgba(250,245,255,0.65)",
  dot:      "rgba(255,255,255,0.3)",
  time:     LNBF.color.white,
  score:    LNBF.color.white,
  scoreDim: "rgba(255,255,255,0.3)",
  infoBg:   "rgba(14,4,24,0.5)",
  default:  "rgba(255,255,255,0.25)",
  accent:   LNBF.color.gold500,
} as const
