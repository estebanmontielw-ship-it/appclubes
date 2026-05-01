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
 * Normaliza un nombre para comparación (lowercase, sin tildes, etc.)
 */
function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Convierte odds fraccional ("5/4") a decimal (2.25). */
function fractionalToDecimal(frac: string | undefined): number | null {
  if (!frac) return null
  const m = frac.match(/^(\d+)\/(\d+)$/)
  if (!m) return null
  const num = parseInt(m[1], 10), den = parseInt(m[2], 10)
  if (den === 0) return null
  return Math.round((num / den + 1) * 1000) / 1000
}

/**
 * SofaScore — API JSON pública, sin auth. Cubre LNB Paraguay.
 *
 * Estrategia:
 * 1. Llamar /sport/basketball/scheduled-events/{fecha} para traer todos
 *    los partidos de basket de ese día a nivel global.
 * 2. Filtrar por nombres de equipos normalizados.
 * 3. Para el event encontrado, llamar /event/{id}/odds/1/all.
 * 4. Parsear los markets (Total over/under, 1X2 money line, Asian handicap).
 */
async function scrapeSofaScore(
  matchId: string,
  equipoLocal: string,
  equipoVisit: string,
  fecha?: string
): Promise<ScrapeResultado> {
  if (!fecha) {
    return {
      fuente: "sofascore",
      ok: false,
      cuotas: [],
      errorMessage: "FECHA_REQUERIDA",
      notas: "Necesito la fecha del partido para buscarlo en SofaScore",
    }
  }

  // 1. Traer partidos del día
  const r = await safeFetch(
    `https://api.sofascore.com/api/v1/sport/basketball/scheduled-events/${fecha}`,
    {},
    8000
  )
  if (!r || !r.ok) {
    return {
      fuente: "sofascore",
      ok: false,
      cuotas: [],
      errorMessage: r ? `HTTP ${r.status}` : "TIMEOUT",
      notas: "SofaScore scheduled-events no respondió",
    }
  }
  const data = await r.json()
  const events: any[] = data?.events ?? []

  // 2. Buscar match por nombre de equipos
  const localNorm = normName(equipoLocal)
  const visitNorm = normName(equipoVisit)
  let evento: any = null
  for (const ev of events) {
    const home = normName(ev.homeTeam?.name ?? "")
    const away = normName(ev.awayTeam?.name ?? "")
    const matchHome =
      home === localNorm || home.includes(localNorm) || localNorm.includes(home)
    const matchAway =
      away === visitNorm || away.includes(visitNorm) || visitNorm.includes(away)
    if (matchHome && matchAway) {
      evento = ev
      break
    }
  }

  if (!evento) {
    // Filtrar a Paraguay para mejor diagnóstico
    const enParaguay = events.filter((ev) =>
      String(ev.tournament?.category?.name ?? "")
        .toLowerCase()
        .includes("paraguay")
    )
    return {
      fuente: "sofascore",
      ok: false,
      cuotas: [],
      errorMessage: "NOT_FOUND",
      notas: `No se encontró el partido en SofaScore (${events.length} eventos basket ese día, ${enParaguay.length} en Paraguay). Buscado: ${localNorm} vs ${visitNorm}.`,
    }
  }

  const sofaEventId = evento.id

  // 3. Traer odds del event
  const oddsR = await safeFetch(
    `https://api.sofascore.com/api/v1/event/${sofaEventId}/odds/1/all`,
    {},
    8000
  )
  if (!oddsR || !oddsR.ok) {
    return {
      fuente: "sofascore",
      ok: false,
      cuotas: [],
      errorMessage: oddsR ? `ODDS_HTTP_${oddsR.status}` : "ODDS_TIMEOUT",
      notas: `Match encontrado (SofaScore eventId ${sofaEventId}) pero el endpoint de odds falló. Posible: el partido es muy antiguo o no tiene cuotas en SofaScore.`,
    }
  }
  const oddsData = await oddsR.json()
  const markets: any[] = oddsData?.markets ?? []

  if (markets.length === 0) {
    return {
      fuente: "sofascore",
      ok: false,
      cuotas: [],
      errorMessage: "NO_ODDS",
      notas: `SofaScore tiene el partido (eventId ${sofaEventId}) pero no publica cuotas. Esto es típico de ligas tier-2 latinoamericanas.`,
    }
  }

  // 4. Parsear markets a CuotaCapturada
  const cuotas: CuotaCapturada[] = []
  const fuenteUrl = `https://www.sofascore.com/event/${sofaEventId}`

  for (const market of markets) {
    const name = String(market.marketName ?? "").toLowerCase()

    // Money line (1X2)
    if (name === "1x2" || name === "full time") {
      for (const c of market.choices ?? []) {
        const decimal = fractionalToDecimal(c.fractionalValue)
        if (decimal == null) continue
        const lado: "home" | "away" | null =
          c.name === "1" ? "home" : c.name === "2" ? "away" : null
        if (!lado) continue
        cuotas.push({
          fuente: "sofascore",
          fuenteUrl,
          mercado: "money_line",
          linea: null,
          lado,
          cuota: decimal,
          raw: { marketName: market.marketName, choice: c },
        })
      }
    }

    // Total over/under
    else if (name === "total" || name === "total points" || name.includes("total")) {
      const linea = market.choiceGroup ? parseFloat(market.choiceGroup) : null
      for (const c of market.choices ?? []) {
        const decimal = fractionalToDecimal(c.fractionalValue)
        if (decimal == null) continue
        const cn = String(c.name ?? "").toLowerCase()
        const lado: "over" | "under" | null = cn.includes("over")
          ? "over"
          : cn.includes("under")
            ? "under"
            : null
        if (!lado) continue
        cuotas.push({
          fuente: "sofascore",
          fuenteUrl,
          mercado: "total_over_under",
          linea,
          lado,
          cuota: decimal,
          raw: { marketName: market.marketName, choice: c },
        })
      }
    }

    // Asian handicap (spread)
    else if (name.includes("handicap") || name.includes("spread")) {
      const linea = market.choiceGroup ? parseFloat(market.choiceGroup) : null
      for (const c of market.choices ?? []) {
        const decimal = fractionalToDecimal(c.fractionalValue)
        if (decimal == null) continue
        const lado: "home" | "away" | null =
          c.name === "1" ? "home" : c.name === "2" ? "away" : null
        if (!lado) continue
        cuotas.push({
          fuente: "sofascore",
          fuenteUrl,
          mercado: "spread",
          linea,
          lado,
          cuota: decimal,
          raw: { marketName: market.marketName, choice: c },
        })
      }
    }
  }

  if (cuotas.length === 0) {
    return {
      fuente: "sofascore",
      ok: false,
      cuotas: [],
      errorMessage: "MARKETS_NO_PARSED",
      notas: `SofaScore devolvió ${markets.length} markets pero ninguno parseable a 1X2 / Total / Spread. Markets: ${markets.map((m) => m.marketName).join(", ")}`,
    }
  }

  return {
    fuente: "sofascore",
    ok: true,
    cuotas,
    notas: `Match encontrado en SofaScore (eventId ${sofaEventId}, "${evento.tournament?.name}"). ${cuotas.length} cuotas extraídas.`,
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
  equipoVisit: string,
  fecha?: string
): Promise<ScrapeResultado[]> {
  const resultados = await Promise.all([
    scrapeLeoVegas(matchId),
    scrapeCasaApostas(matchId),
    scrapeOrenes(matchId),
    scrapeDraftKings(matchId),
    scrapeSofaScore(matchId, equipoLocal, equipoVisit, fecha),
    scrapeFlashscore(matchId),
  ])
  return resultados
}
