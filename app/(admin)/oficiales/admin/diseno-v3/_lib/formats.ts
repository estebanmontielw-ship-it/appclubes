// Formatos de canvas disponibles en V3.
// Las dimensiones son en píxeles "reales" (lo que se exporta).
// El stage calcula el zoom para que entre en pantalla.
export type FormatKey = "feed" | "post" | "story" | "yt" | "a4v"

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
  { key: "feed",  label: "Feed 4:5",      sub: "1080 × 1350", width: 1080, height: 1350 },
  { key: "post",  label: "Post 1:1",      sub: "1080 × 1080", width: 1080, height: 1080 },
  { key: "story", label: "Historia 9:16", sub: "1080 × 1920", width: 1080, height: 1920, safeTop: 250, safeBottom: 310 },
  { key: "yt",    label: "YouTube 16:9",  sub: "1920 × 1080", width: 1920, height: 1080 },
  { key: "a4v",   label: "A4 Vertical",   sub: "2480 × 3508", width: 2480, height: 3508 },
]

export function getFormat(key: string): CanvasFormat {
  return FORMATS.find((f) => f.key === key) ?? FORMATS[0]
}
