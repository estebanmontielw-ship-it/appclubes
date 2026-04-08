// Focal point helpers
// Focal point is encoded in the URL hash as #fp=<x>,<y> where x and y are
// percentages (0-100). This lets us persist a custom "center" for cover
// images without touching the DB schema. The hash is ignored by CDNs /
// Supabase Storage and by the Next.js image optimizer, so the underlying
// request always hits the clean URL.

export interface FocalImage {
  /** Clean URL without the #fp= hash */
  src: string
  /** CSS object-position value: either "center" or "X% Y%" */
  objectPosition: string
  /** Raw percentages — useful when you need the numeric value */
  focal: { x: number; y: number } | null
}

const FP_HASH_REGEX = /#fp=(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/

export function parseFocalPoint(url?: string | null): FocalImage {
  if (!url) return { src: "", objectPosition: "center", focal: null }

  const match = url.match(FP_HASH_REGEX)
  if (!match) return { src: url, objectPosition: "center", focal: null }

  const x = Math.max(0, Math.min(100, parseFloat(match[1])))
  const y = Math.max(0, Math.min(100, parseFloat(match[2])))
  const cleanIndex = url.lastIndexOf("#fp=")
  const src = cleanIndex >= 0 ? url.slice(0, cleanIndex) : url

  return {
    src,
    objectPosition: `${x}% ${y}%`,
    focal: { x, y },
  }
}

export function withFocalPoint(url: string, focal: { x: number; y: number } | null): string {
  const base = url.replace(FP_HASH_REGEX, "")
  if (!focal) return base
  const x = Math.round(Math.max(0, Math.min(100, focal.x)) * 10) / 10
  const y = Math.round(Math.max(0, Math.min(100, focal.y)) * 10) / 10
  return `${base}#fp=${x},${y}`
}
