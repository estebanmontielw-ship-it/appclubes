// Formatos V3 — reducidos a los 3 únicos que se usan:
//   • Feed (IG 4:5)
//   • Stories (IG 9:16)
//   • Noticias CPB (banner web 2250×1266 ≈ 16:9 ancho)

export type FormatKey = "feed" | "story" | "noticia"

export interface CanvasFormat {
  key: FormatKey
  label: string
  sub: string
  width: number
  height: number
  safeTop?: number
  safeBottom?: number
}

export const FORMATS: CanvasFormat[] = [
  { key: "feed",    label: "Feed",         sub: "1080 × 1350 (4:5)",  width: 1080, height: 1350 },
  { key: "story",   label: "Stories",      sub: "1080 × 1920 (9:16)", width: 1080, height: 1920, safeTop: 250, safeBottom: 310 },
  { key: "noticia", label: "Noticias CPB", sub: "2250 × 1266",        width: 2250, height: 1266 },
]

export function getFormat(key: string): CanvasFormat {
  return FORMATS.find((f) => f.key === key) ?? FORMATS[0]
}
