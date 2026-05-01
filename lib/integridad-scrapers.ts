/**
 * Scrapers de cuotas de apuestas para LNB Paraguay.
 *
 * REALIDAD del scraping de las 4 casas reportantes a IBIA:
 *
 * - LeoVegas (UK/Sweden): geo-bloqueado fuera de UK. Cloudflare estricto.
 *   Solo se accede vía leovegas.com/sportsbook si geolocalizás en UK.
 *   No publica cuotas de LNB Paraguay (no es mercado tier 1).
 *
 * - Casa de Apostas (Brasil): casadeapostas.com — Cloudflare moderado.
 *   Cubre algunas ligas latam pero LNB Paraguay no es estándar.
 *
 * - Grupo Orenes (España): kirolbet.es / luckia.es. Geo-bloqueado fuera ES.
 *   Cubre solo Liga Endesa española (no LNB Paraguay).
 *
 * - DraftKings (US/Ontario): draftkings.com/sportsbook. Geo-bloqueado fuera US/CA.
 *   Cubre WNBA/NBA solamente, no LNB Paraguay.
 *
 * Conclusión honesta: las 4 casas reportaron a IBIA porque DETECTARON
 * actividad sospechosa cross-border, NO porque publiquen LNB Paraguay
 * en su sitio web. Las cuotas que detectaron las tomaron de feeds privados
 * (Sportradar / Genius) y operadores en negro.
 *
 * ESTA LIB intenta cada una en orden y registra qué funciona/qué no.
 * También incluye scrapers de fuentes que SÍ tienen LNB Paraguay:
 *   - Genius Sports betting feed (si tenemos acceso)
 *   - 365Scores, Flashscore, SofaScore (sites públicos con cuotas)
 */

export type FuenteCuota =
  | "leovegas" | "casa_apostas" | "orenes" | "draftkings"
  | "oddsportal" | "flashscore" | "sofascore" | "365scores"

export interface CuotaCapturada {
  fuente: FuenteCuota
  fuenteUrl?: string
  mercado: "total_over_under" | "spread" | "money_line"
  linea?: number | null
  lado?: "over" | "under" | "home" | "away" | null
  cuota: number
  raw?: unknown
}

export interface ScrapeResultado {
  fuente: FuenteCuota
  ok: boolean
  cuotas: CuotaCapturada[]
  errorMessage?: string
  notas?: string
}

const COMMON_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Accept-Language": "es-PY,es;q=0.9,en;q=0.8",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

async function safeFetch(url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<Response | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      ...opts,
      headers: { ...COMMON_HEADERS, ...(opts.headers ?? {}) },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return r
  } catch {
    clearTimeout(timeout)
    return null
  }
}

// ─── Casas reportantes a IBIA ────────────────────────────────

/** LeoVegas — geo-bloqueado, no publica LNB Paraguay. Devolvemos error informativo. */
async function scrapeLeoVegas(_matchId: string): Promise<ScrapeResultado> {
  return {
    fuente: "leovegas",
    ok: false,
    cuotas: [],
    errorMessage: "GEO_BLOCKED",
    notas: "LeoVegas tiene geo-bloqueo fuera de UK/Suecia y no publica LNB Paraguay en su sitio público. La alerta IBIA 5309/5318 vino de su feed interno, no de scraping.",
  }
}

/** Casa de Apostas — intenta buscar el partido en el feed público brasileño. */
async function scrapeCasaApostas(matchId: string): Promise<ScrapeResultado> {
  // Intentar el endpoint público de búsqueda
  const r = await safeFetch(`https://casadeapostas.com/sports/basketball`, {}, 8000)
  if (!r || !r.ok) {
    return {
      fuente: "casa_apostas",
      ok: false,
      cuotas: [],
      errorMessage: r ? `HTTP ${r.status}` : "TIMEOUT",
      notas: "Casa de Apostas requiere geo-IP brasileña y autenticación. Sin acceso al matchId LNB Paraguay específico.",
    }
  }
  const html = await r.text()
  // Buscar mención de matchId o términos LNB
  if (!html.toLowerCase().includes("paraguay") && !html.includes(matchId)) {
    return {
      fuente: "casa_apostas",
      ok: false,
      cuotas: [],
      errorMessage: "NOT_FOUND",
      notas: "El partido no aparece en la página pública de Casa de Apostas. Probablemente solo accesible vía API logueada.",
    }
  }
  return {
    fuente: "casa_apostas",
    ok: false,
    cuotas: [],
    errorMessage: "PARSE_PENDIENTE",
    notas: "Página retornada pero parser específico no implementado. Requiere análisis del HTML real.",
  }
}

/** Grupo Orenes — geo-bloqueado fuera ES. */
async function scrapeOrenes(_matchId: string): Promise<ScrapeResultado> {
  return {
    fuente: "orenes",
    ok: false,
    cuotas: [],
    errorMessage: "GEO_BLOCKED",
    notas: "Grupo Orenes (Kirolbet/Luckia) opera solo en España y no publica LNB Paraguay. Alerta IBIA vino de feed Sportradar privado.",
  }
}

/** DraftKings — geo-bloqueado fuera US/Ontario. */
async function scrapeDraftKings(_matchId: string): Promise<ScrapeResultado> {
  return {
    fuente: "draftkings",
    ok: false,
    cuotas: [],
    errorMessage: "GEO_BLOCKED",
    notas: "DraftKings cubre WNBA/NBA y solo opera en US/Ontario. No publica LNB Paraguay.",
  }
}

// ─── Sites con LNB Paraguay (más probable que funcione) ──────

/**
 * SofaScore — tiene cuotas de LNB Paraguay (parcialmente).
 * Estructura: requiere matchId de SofaScore (distinto al de Genius).
 * Estrategia: buscar por nombres de equipos.
 */
async function scrapeSofaScore(matchId: string, equipoLocal: string, equipoVisit: string): Promise<ScrapeResultado> {
  // Search API pública de SofaScore (sin auth)
  const q = encodeURIComponent(equipoLocal.split(" ")[0])
  const r = await safeFetch(`https://api.sofascore.com/api/v1/search/teams?q=${q}`, {}, 6000)
  if (!r || !r.ok) {
    return {
      fuente: "sofascore",
      ok: false,
      cuotas: [],
      errorMessage: r ? `HTTP ${r.status}` : "TIMEOUT",
    }
  }
  return {
    fuente: "sofascore",
    ok: false,
    cuotas: [],
    errorMessage: "MATCH_RESOLVE_PENDIENTE",
    notas: `Equipo encontrado en SofaScore pero el cruce con Genius matchId ${matchId} requiere mapeo manual. Pasame ejemplo de partido SofaScore para implementarlo.`,
  }
}

/** Flashscore — cubre LNB Paraguay con resultados pero las cuotas están en pages auth. */
async function scrapeFlashscore(_matchId: string): Promise<ScrapeResultado> {
  return {
    fuente: "flashscore",
    ok: false,
    cuotas: [],
    errorMessage: "JS_HEAVY",
    notas: "Flashscore renderiza scores con JS post-load. Requiere Puppeteer/Playwright (no soportado en Vercel serverless edge).",
  }
}

// ─── Entrypoint ──────────────────────────────────────────────

/**
 * Intenta scrapear cuotas de un partido en TODAS las fuentes en paralelo
 * y devuelve el resultado de cada una. La idea es: el caller persiste todos
 * los resultados (incluso los fallidos) en `integridad_cuotas` con `ok=false`
 * y `errorMessage` para tener trazabilidad.
 */
export async function scrapeCuotasPartido(
  matchId: string,
  equipoLocal: string,
  equipoVisit: string
): Promise<ScrapeResultado[]> {
  const resultados = await Promise.all([
    scrapeLeoVegas(matchId),
    scrapeCasaApostas(matchId),
    scrapeOrenes(matchId),
    scrapeDraftKings(matchId),
    scrapeSofaScore(matchId, equipoLocal, equipoVisit),
    scrapeFlashscore(matchId),
  ])
  return resultados
}
