// Tokens del tema LNB Premium (Masculino) — navy profundo + gold.
// Basado en el handoff de Claude Design (/design-handoff/lnb/).
// Se usan inline en el flyer-v2 (satori no soporta className).

export const LNB = {
  color: {
    // Navy / base
    navy950: "#03081A",
    navy900: "#081233",
    navy800: "#0E1D4F",
    navy700: "#132970",
    navy600: "#1E3FA8",
    blue500: "#2D56D4",
    blue400: "#5A83F2",
    // Text
    softBlue: "#A6BEFF",
    mutedBlue: "#8FA3CF",
    cream: "#C5D3F2",
    white: "#F2F5FF",
    // Accents
    gold500:  "#D4AF37",
    gold400:  "#E6C865",
    red500:   "#C8261F",
    red400:   "#E63322",
  },
  font: {
    display: "Archivo Black", // hero + scores
    heading: "Bebas Neue",    // eyebrows + labels
    body:    "Inter",         // UI general
  },
  radius: { sm: 8, md: 12, lg: 18, xl: 22 },
  // Base linear (satori estable; el radial del source es solo para preview HTML)
  bgHero: "linear-gradient(160deg, #1E3FA8 0%, #0E1D4F 38%, #081233 70%, #03081A 100%)",
  // Glows radiales circulares para esquinas
  glowBlueRadial: "radial-gradient(circle, rgba(45,86,212,0.45) 0%, rgba(45,86,212,0) 65%)",
  glowGoldRadial: "radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0) 65%)",
  glowRedRadial:  "radial-gradient(circle, rgba(230,51,34,0.22) 0%, rgba(230,51,34,0) 65%)",
} as const

export const LNB_TC = {
  title:    LNB.color.white,
  subtitle: LNB.color.softBlue,
  team:     LNB.color.white,
  venue:    "rgba(242,245,255,0.75)",
  dot:      "rgba(255,255,255,0.3)",
  time:     LNB.color.white,
  score:    LNB.color.white,
  scoreDim: "rgba(255,255,255,0.3)",
  infoBg:   "rgba(3,8,26,0.62)",
  default:  "rgba(255,255,255,0.25)",
  accent:   LNB.color.gold500,
} as const
