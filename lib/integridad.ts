/**
 * Análisis de Integridad — detección de patrones de manipulación.
 *
 * Lógica pura: dadas las stats de un partido y la lista de jugadores
 * tier (jugadores bajo seguimiento), detecta patrones sospechosos que
 * coinciden con los reportes de Sportradar UFDS / IBIA.
 *
 * El fetching de datos vive en las rutas de `/api/admin/integridad/*`
 * y reutiliza `lib/genius-sports.ts` + FibaLiveStats.
 */

// ─── CONSTANTES ──────────────────────────────────────────────

/** Clubes monitoreados por defecto (caso CPB / LNB Apertura 2026). */
export const MONITORED_TEAMS = [
  { name: "SAN ALFONZO", sigla: "ALF" },
  { name: "DEPORTIVO CAMPOALTO", sigla: "CAM" },
  { name: "CIUDAD NUEVA", sigla: "CIU" },
] as const

/** Promedios de referencia para la LNB Paraguay (ajustables). */
export const LNB_REFS = {
  totalPromedio: 150,
  firstHalfPromedio: 75,
} as const

// ─── TIPOS ───────────────────────────────────────────────────

export type Severidad = "BAJO" | "MEDIO" | "ALTO" | "CRITICO"
export type Tier = "TIER_1" | "TIER_2" | "TIER_3"

export interface BoxscorePlayer {
  name: string
  number: string
  /** minutos: número (Genius warehouse) o string "MM:SS" (FibaLiveStats). */
  min: number | string
  pts: number
  fg2m: number; fg2a: number
  fg3m: number; fg3a: number
  ftm: number; fta: number
  reb: number
  ast: number
  stl: number; blk: number
  to: number; pf: number
  starter: boolean
  captain: boolean
}

export interface BoxscoreTeam {
  name: string
  sigla: string | null
  score: number | null
  players: BoxscorePlayer[]
}

export interface MatchSnapshot {
  matchId: string
  fecha: string | null
  competicionId: string | null
  competicionName: string | null
  equipoLocal: string
  equipoLocalSigla: string | null
  equipoVisit: string
  equipoVisitSigla: string | null
  scoreLocal: number | null
  scoreVisit: number | null
  totalPuntos: number | null
  /** Score por cuarto: [{ home, away }, ...]. */
  periodScores: Array<{ home: number; away: number }>
  estadoPartido: string | null
  home: BoxscoreTeam
  away: BoxscoreTeam
}

export interface JugadorTier {
  nombre: string
  nombreNorm: string
  club: string
  clubSigla: string | null
  numero: number | null
  tier: Tier
}

export interface DetectedPattern {
  tipo: string
  tipoLabel: string
  severidad: Severidad
  descripcion: string
  datos: Record<string, unknown>
  jugadoresInvolucrados: Array<{ nombre: string; club: string; tier?: Tier }>
}

// ─── HELPERS ─────────────────────────────────────────────────

/**
 * Normaliza un nombre para matching: lowercase, sin tildes, sin
 * caracteres especiales. Usar siempre para comparar nombres entre
 * sistemas (Genius personId ≠ FIBA spi_id, ver CLAUDE.md).
 */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Convierte minutos de cualquier formato a número decimal.
 * Acepta: number, "MM:SS", "MM", "–", "".
 */
export function parseMinutes(min: number | string): number | null {
  if (typeof min === "number") return Number.isFinite(min) ? min : null
  if (typeof min !== "string") return null
  const trimmed = min.trim()
  if (!trimmed || trimmed === "–" || trimmed === "-") return null
  const colon = trimmed.indexOf(":")
  if (colon > 0) {
    const m = parseInt(trimmed.slice(0, colon), 10)
    const s = parseInt(trimmed.slice(colon + 1), 10)
    if (Number.isFinite(m)) return m + (Number.isFinite(s) ? s / 60 : 0)
  }
  const n = parseFloat(trimmed)
  return Number.isFinite(n) ? n : null
}

/** Indica si un equipo (por nombre o sigla) está en la lista de monitoreados. */
export function isMonitoredTeam(name: string, sigla: string | null): boolean {
  const norm = normalizeName(name)
  const sig = (sigla ?? "").toUpperCase()
  return MONITORED_TEAMS.some(
    (t) => normalizeName(t.name) === norm || (sig !== "" && t.sigla === sig)
  )
}

/** Busca un jugador en el tier list por nombre normalizado. */
function findInTier(playerName: string, tier: JugadorTier[]): JugadorTier | undefined {
  const norm = normalizeName(playerName)
  return tier.find((t) => t.nombreNorm === norm)
}

const SEV_RANK: Record<Severidad, number> = { BAJO: 1, MEDIO: 2, ALTO: 3, CRITICO: 4 }

export function severidadRank(s: Severidad): number {
  return SEV_RANK[s] ?? 0
}

/** Severidad máxima de un set de patrones, o null si está vacío. */
export function maxSeveridad(patterns: DetectedPattern[]): Severidad | null {
  if (patterns.length === 0) return null
  let max: Severidad = "BAJO"
  for (const p of patterns) {
    if (severidadRank(p.severidad) > severidadRank(max)) max = p.severidad
  }
  return max
}

// ─── DETECTORES DE PATRONES ──────────────────────────────────

/** Q4 collapse: el perdedor anotó <50% de su promedio Q1-Q3 y la
 *  diferencia del Q4 fue >15. */
function detectQ4Collapse(snap: MatchSnapshot): DetectedPattern | null {
  if (snap.periodScores.length < 4) return null
  const q1to3 = snap.periodScores.slice(0, 3)
  const q4 = snap.periodScores[3]
  const diffQ4 = Math.abs(q4.home - q4.away)
  if (diffQ4 < 15) return null

  const loserIsHome = q4.home < q4.away
  const loserOtherQs = q1to3.map((p) => (loserIsHome ? p.home : p.away))
  const promedio = loserOtherQs.reduce((a, b) => a + b, 0) / loserOtherQs.length
  const loserQ4 = loserIsHome ? q4.home : q4.away
  if (loserQ4 >= promedio * 0.5) return null

  const equipo = loserIsHome ? snap.equipoLocal : snap.equipoVisit
  return {
    tipo: "q4_collapse",
    tipoLabel: "Colapso del Q4",
    severidad: "ALTO",
    descripcion: `${equipo} anotó solo ${loserQ4} en Q4 (vs ${promedio.toFixed(1)} promedio en Q1–Q3). Diferencia del cuarto: ${diffQ4} puntos.`,
    datos: {
      equipoColapso: equipo,
      q4Anotado: loserQ4,
      promedioQ1Q3: Math.round(promedio * 10) / 10,
      diferenciaQ4: diffQ4,
    },
    jugadoresInvolucrados: [],
  }
}

/** Total del partido fuera de rango (±15% del promedio LNB). */
function detectTotalAnomalo(snap: MatchSnapshot): DetectedPattern | null {
  if (snap.totalPuntos == null) return null
  const ref = LNB_REFS.totalPromedio
  const ratio = snap.totalPuntos / ref
  if (ratio < 0.85) {
    return {
      tipo: "total_anomalo_bajo",
      tipoLabel: "Total bajo anómalo",
      severidad: "MEDIO",
      descripcion: `Total del partido: ${snap.totalPuntos} puntos. Promedio LNB ~${ref}. Ratio ${(ratio * 100).toFixed(0)}%.`,
      datos: { total: snap.totalPuntos, promedioRef: ref, ratio },
      jugadoresInvolucrados: [],
    }
  }
  if (ratio > 1.15) {
    return {
      tipo: "total_anomalo_alto",
      tipoLabel: "Total alto anómalo",
      severidad: "MEDIO",
      descripcion: `Total del partido: ${snap.totalPuntos} puntos. Promedio LNB ~${ref}. Ratio ${(ratio * 100).toFixed(0)}%.`,
      datos: { total: snap.totalPuntos, promedioRef: ref, ratio },
      jugadoresInvolucrados: [],
    }
  }
  return null
}

/** Primer tiempo bajo: <85% del promedio LNB de primer tiempo. */
function detectFirstHalfUnder(snap: MatchSnapshot): DetectedPattern | null {
  if (snap.periodScores.length < 2) return null
  const q1 = snap.periodScores[0]
  const q2 = snap.periodScores[1]
  const total = q1.home + q1.away + q2.home + q2.away
  const ref = LNB_REFS.firstHalfPromedio
  if (total >= ref * 0.85) return null
  return {
    tipo: "first_half_under",
    tipoLabel: "First Half Under anómalo",
    severidad: "MEDIO",
    descripcion: `Primer tiempo cerró en ${total} puntos totales — bajo respecto al promedio LNB (~${ref}).`,
    datos: { firstHalfTotal: total, promedioRef: ref },
    jugadoresInvolucrados: [],
  }
}

/** Tiros libres fallados ≥3 en un jugador Tier 1/2. */
function detectTLsFallados(snap: MatchSnapshot, tier: JugadorTier[]): DetectedPattern[] {
  const out: DetectedPattern[] = []
  const all = [
    ...snap.home.players.map((p) => ({ p, club: snap.home.name })),
    ...snap.away.players.map((p) => ({ p, club: snap.away.name })),
  ]
  for (const { p, club } of all) {
    const fallados = p.fta - p.ftm
    if (fallados < 3) continue
    const t = findInTier(p.name, tier)
    if (!t || (t.tier !== "TIER_1" && t.tier !== "TIER_2")) continue
    out.push({
      tipo: "tls_fallados_anomalos",
      tipoLabel: "Tiros libres fallados anómalos",
      severidad: t.tier === "TIER_1" ? "ALTO" : "MEDIO",
      descripcion: `${p.name} (${club}) erró ${fallados} de ${p.fta} TLs — jugador ${t.tier}.`,
      datos: { jugador: p.name, club, ftm: p.ftm, fta: p.fta, fallados, tier: t.tier },
      jugadoresInvolucrados: [{ nombre: p.name, club, tier: t.tier }],
    })
  }
  return out
}

/** Productivo sentado: FG% >50% con ≥3 intentos pero <50% de minutos
 *  del partido (asumimos 40 min) y sin 5 faltas. */
function detectProductivoSentado(snap: MatchSnapshot, tier: JugadorTier[]): DetectedPattern[] {
  const out: DetectedPattern[] = []
  const all = [
    ...snap.home.players.map((p) => ({ p, club: snap.home.name })),
    ...snap.away.players.map((p) => ({ p, club: snap.away.name })),
  ]
  for (const { p, club } of all) {
    const fga = p.fg2a + p.fg3a
    const fgm = p.fg2m + p.fg3m
    if (fga < 3) continue
    const fgPct = fgm / fga
    if (fgPct <= 0.5) continue
    const minutos = parseMinutes(p.min)
    if (minutos == null || minutos >= 20) continue
    if (p.pf >= 5) continue

    const t = findInTier(p.name, tier)
    out.push({
      tipo: "productivo_sentado",
      tipoLabel: "Jugador productivo sentado",
      severidad: t ? "MEDIO" : "BAJO",
      descripcion: `${p.name} (${club}) jugó ${minutos.toFixed(1)} min con FG ${(fgPct * 100).toFixed(0)}% (${fgm}/${fga}) y ${p.pf} faltas.`,
      datos: {
        jugador: p.name, club, minutos, fgm, fga,
        fgPct: Math.round(fgPct * 1000) / 1000, pf: p.pf,
      },
      jugadoresInvolucrados: t
        ? [{ nombre: p.name, club, tier: t.tier }]
        : [{ nombre: p.name, club }],
    })
  }
  return out
}

/** Pérdidas en cadena: ≥4 turnovers en un jugador Tier 1/2. */
function detectPerdidasCadena(snap: MatchSnapshot, tier: JugadorTier[]): DetectedPattern[] {
  const out: DetectedPattern[] = []
  const all = [
    ...snap.home.players.map((p) => ({ p, club: snap.home.name })),
    ...snap.away.players.map((p) => ({ p, club: snap.away.name })),
  ]
  for (const { p, club } of all) {
    if (p.to < 4) continue
    const t = findInTier(p.name, tier)
    if (!t || (t.tier !== "TIER_1" && t.tier !== "TIER_2")) continue
    out.push({
      tipo: "perdidas_cadena",
      tipoLabel: "Pérdidas en cadena (jugador Tier)",
      severidad: "MEDIO",
      descripcion: `${p.name} (${club}) acumuló ${p.to} pérdidas — jugador ${t.tier}.`,
      datos: { jugador: p.name, club, to: p.to, tier: t.tier },
      jugadoresInvolucrados: [{ nombre: p.name, club, tier: t.tier }],
    })
  }
  return out
}

/** Capitán pasivo: capitán de equipo perdedor por >15 con ≥30 min y ≤1 ast.
 *  Solo aplica con score final (estadoPartido = COMPLETE). */
function detectCapitanPasivo(snap: MatchSnapshot, tier: JugadorTier[]): DetectedPattern[] {
  const out: DetectedPattern[] = []
  if (snap.estadoPartido !== "COMPLETE") return out
  if (snap.scoreLocal == null || snap.scoreVisit == null) return out
  const teams: Array<{ team: BoxscoreTeam; lostBy: number }> = [
    { team: snap.home, lostBy: snap.scoreVisit - snap.scoreLocal },
    { team: snap.away, lostBy: snap.scoreLocal - snap.scoreVisit },
  ]
  for (const { team, lostBy } of teams) {
    if (lostBy <= 15) continue
    for (const p of team.players) {
      if (!p.captain) continue
      const minutos = parseMinutes(p.min)
      if (minutos == null || minutos < 30) continue
      if (p.ast > 1) continue
      const t = findInTier(p.name, tier)
      out.push({
        tipo: "capitan_pasivo",
        tipoLabel: "Capitán pasivo en derrota",
        severidad: "MEDIO",
        descripcion: `Capitán ${p.name} (${team.name}) jugó ${minutos.toFixed(1)} min con ${p.ast} asistencia${p.ast === 1 ? "" : "s"}. Su equipo perdió por ${lostBy}.`,
        datos: { jugador: p.name, club: team.name, minutos, ast: p.ast, lostBy },
        jugadoresInvolucrados: t
          ? [{ nombre: p.name, club: team.name, tier: t.tier }]
          : [{ nombre: p.name, club: team.name }],
      })
    }
  }
  return out
}

/** Selección de tiros anómala: jugador con FG2% >50% pero más triples
 *  que dos en partido perdido por >15. Solo aplica con score final. */
function detectSeleccionTirosAnomala(snap: MatchSnapshot, tier: JugadorTier[]): DetectedPattern[] {
  const out: DetectedPattern[] = []
  if (snap.estadoPartido !== "COMPLETE") return out
  if (snap.scoreLocal == null || snap.scoreVisit == null) return out
  const teams: Array<{ team: BoxscoreTeam; lostBy: number }> = [
    { team: snap.home, lostBy: snap.scoreVisit - snap.scoreLocal },
    { team: snap.away, lostBy: snap.scoreLocal - snap.scoreVisit },
  ]
  for (const { team, lostBy } of teams) {
    if (lostBy <= 15) continue
    for (const p of team.players) {
      if (p.fg2a < 3) continue
      const fg2pct = p.fg2m / p.fg2a
      if (fg2pct <= 0.5) continue
      if (p.fg3a <= p.fg2a) continue
      const t = findInTier(p.name, tier)
      out.push({
        tipo: "seleccion_tiros_anomala",
        tipoLabel: "Selección de tiros anómala",
        severidad: "MEDIO",
        descripcion: `${p.name} (${team.name}) tiró ${p.fg3a} de 3 vs ${p.fg2a} de 2 con FG2 ${(fg2pct * 100).toFixed(0)}%. Equipo perdió por ${lostBy}.`,
        datos: {
          jugador: p.name, club: team.name,
          fg2m: p.fg2m, fg2a: p.fg2a, fg3m: p.fg3m, fg3a: p.fg3a,
          fg2pct: Math.round(fg2pct * 1000) / 1000, lostBy,
        },
        jugadoresInvolucrados: t
          ? [{ nombre: p.name, club: team.name, tier: t.tier }]
          : [{ nombre: p.name, club: team.name }],
      })
    }
  }
  return out
}

// ─── ENTRYPOINT ──────────────────────────────────────────────

/** Indica si el partido es crítico (dos clubes monitoreados se enfrentan). */
export function esPartidoCritico(snap: MatchSnapshot): boolean {
  return (
    isMonitoredTeam(snap.equipoLocal, snap.equipoLocalSigla) &&
    isMonitoredTeam(snap.equipoVisit, snap.equipoVisitSigla)
  )
}

/**
 * Punto de entrada principal: detecta todos los patrones aplicables.
 * Lógica pura — no hace I/O, solo calcula.
 */
export function detectPatterns(
  snap: MatchSnapshot,
  tier: JugadorTier[]
): DetectedPattern[] {
  const patterns: DetectedPattern[] = []

  if (esPartidoCritico(snap)) {
    patterns.push({
      tipo: "partido_critico",
      tipoLabel: "Partido crítico — 2 clubes monitoreados",
      severidad: "CRITICO",
      descripcion: `${snap.equipoLocal} vs ${snap.equipoVisit}: ambos clubes están en la lista de monitoreo.`,
      datos: { equipoLocal: snap.equipoLocal, equipoVisit: snap.equipoVisit },
      jugadoresInvolucrados: [],
    })
  }

  const q4 = detectQ4Collapse(snap); if (q4) patterns.push(q4)
  const total = detectTotalAnomalo(snap); if (total) patterns.push(total)
  const fhu = detectFirstHalfUnder(snap); if (fhu) patterns.push(fhu)

  patterns.push(...detectTLsFallados(snap, tier))
  patterns.push(...detectProductivoSentado(snap, tier))
  patterns.push(...detectPerdidasCadena(snap, tier))
  patterns.push(...detectCapitanPasivo(snap, tier))
  patterns.push(...detectSeleccionTirosAnomala(snap, tier))

  return patterns
}
