import { NextResponse } from "next/server"

/**
 * Rate limiter en memoria para API routes.
 * Limita requests por IP en una ventana de tiempo.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Verifica el rate limit para un request.
 * @param request - El request de Next.js
 * @param limit - Máximo de requests permitidos en la ventana
 * @param windowMs - Ventana de tiempo en milisegundos (default: 60s)
 * @param prefix - Prefijo para diferenciar endpoints (ej: "login", "registro")
 * @returns null si está dentro del límite, o un NextResponse 429 si se excedió
 */
export function rateLimit(
  request: Request,
  limit: number,
  windowMs: number = 60_000,
  prefix: string = "global"
): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"

  const key = `${prefix}:${ip}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  entry.count++

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intentá de nuevo en unos momentos." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    )
  }

  return null
}
