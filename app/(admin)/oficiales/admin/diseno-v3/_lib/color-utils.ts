// Helpers de color para armar glows radiales en fabric (requieren rgba)
// y para mezclar colores en previews.

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}
