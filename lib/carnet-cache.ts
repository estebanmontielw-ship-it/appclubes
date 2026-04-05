/**
 * Offline cache for carnet data using localStorage.
 * Stores user info and QR data URL so the carnet is viewable offline.
 */

const CARNET_CACHE_KEY = "cpb_carnet_cache"
const CARNET_CACHE_VERSION = 1

interface CachedCarnet {
  version: number
  timestamp: number
  usuario: {
    nombre: string
    apellido: string
    cedula: string
    ciudad: string
    fotoCarnetUrl: string | null
    estadoVerificacion: string
    verificadoEn: string | null
    qrToken: string | null
    roles: { rol: string }[]
  }
  qrDataUrl: string | null
}

export function saveCarnetToCache(usuario: CachedCarnet["usuario"], qrDataUrl: string | null): void {
  try {
    const data: CachedCarnet = {
      version: CARNET_CACHE_VERSION,
      timestamp: Date.now(),
      usuario,
      qrDataUrl,
    }
    localStorage.setItem(CARNET_CACHE_KEY, JSON.stringify(data))
  } catch {
    // localStorage may be full or unavailable — silently fail
  }
}

export function loadCarnetFromCache(): CachedCarnet | null {
  try {
    const raw = localStorage.getItem(CARNET_CACHE_KEY)
    if (!raw) return null
    const data: CachedCarnet = JSON.parse(raw)
    if (data.version !== CARNET_CACHE_VERSION) return null
    return data
  } catch {
    return null
  }
}

export function clearCarnetCache(): void {
  try {
    localStorage.removeItem(CARNET_CACHE_KEY)
  } catch {
    // silently fail
  }
}
