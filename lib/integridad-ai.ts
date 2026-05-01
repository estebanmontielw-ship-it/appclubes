/**
 * Análisis experto de integridad — generado por Claude.
 *
 * Toma un partido analizado (con patrones detectados automáticamente) y
 * produce un resumen narrativo experto que conecta los puntos, contextualiza
 * con el caso CPB / IBIA / Sportradar UFDS, y sugiere acciones concretas.
 *
 * Uso típico: tras detectPatterns() en /api/admin/integridad/analisis/[matchId].
 */

import Anthropic from "@anthropic-ai/sdk"
import type { DetectedPattern, JugadorTier } from "@/lib/integridad"

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const AI_MODEL = "claude-sonnet-4-20250514"

const SYSTEM_PROMPT = `Sos un analista experto en integridad deportiva especializado en detección de manipulación de partidos de básquetbol. Trabajás para la Confederación Paraguaya de Básquetbol (CPB) en colaboración con IBIA y Sportradar UFDS.

CONTEXTO DEL CASO ABIERTO (LNB Paraguay 2026):
- Hay una investigación en curso de manipulación de partidos
- IBIA emitió 3 alertas oficiales identificadas: 5309, 5313, 5318
- Casas de apuestas que reportaron actividad sospechosa:
  · LeoVegas (Reino Unido / Suecia) — alertas 5309, 5318
  · Casa de Apostas (Brasil) — alertas 5309, 5313, 5318
  · Grupo Orenes (España) — alertas 5309, 5318
  · DraftKings (EE.UU. / Ontario) — alerta 5313
- Las casas son TODAS internacionales (no locales paraguayas) — esto es relevante porque
  bookies internacionales solo monitorean LNB Paraguay cuando hay volumen anómalo
  cross-border, sugiriendo coordinación de la actividad sospechosa
- Sportradar UFDS escaló 6 partidos en su monitoreo
- Clubes con jugadores Tier 1/2 bajo seguimiento: SAN ALFONZO (ALF),
  DEPORTIVO CAMPOALTO (CAM), CIUDAD NUEVA (CIU)

TU TAREA:
Interpretar los patrones detectados automáticamente en un partido específico y
generar una narrativa experta para investigación interna y eventual escalamiento
a IBIA / Sportradar.

ESTILO:
- Español rioplatense profesional, conciso
- Cero hype, cero exclamaciones, cero adjetivos vacíos
- Específico con nombres y números — citar minutos, porcentajes, períodos
- Honesto sobre incertidumbre — los patrones son señales, no pruebas
- Conclusiones concretas y accionables

ESTRUCTURA DEL ANÁLISIS (3-5 párrafos cortos en este orden):

**Síntesis** — qué pasó en el partido en una línea (resultado + qué llama la atención).

**Patrones** — interpretación experta de los patrones detectados, conectándolos.
Si hay múltiples patrones, explicá cómo se relacionan entre sí (ej. "Q4 collapse +
TLs fallados Tier convergen sobre…"). Mencioná los números específicos.

**Contexto Tier / IBIA** — qué jugadores monitoreados aparecen en este partido.
Si los patrones son consistentes con las alertas IBIA del caso (over/under, scoring
anómalo, etc.), mencionalo explícitamente. Si NO hay jugadores Tier en el partido,
decilo y notá si los patrones sugieren expansión de la red a otros jugadores.

**Recomendación** — UNA línea cerrando con uno de estos verdictos:
- ARCHIVAR — patrones débiles o explicables por contexto deportivo normal
- MONITOREAR — señales que justifican observación pero aún no escalamiento
- REVISAR — múltiples señales convergentes que merecen investigación interna
- ESCALAR A IBIA — patrones severos consistentes con manipulación; preparar
  documentación para enviar a IBIA / Sportradar UFDS

REGLAS CRÍTICAS:
- NUNCA acusés explícitamente a un jugador de manipulación. Decí "patrón consistente
  con", "comportamiento que merece revisión", "señales convergentes".
- NO inventés datos que no estén en el input
- Si los patrones son débiles, decilo honestamente — no infles severidad
- Mencioná IBIA / Sportradar UFDS solo si los patrones lo ameritan
- No usés markdown — solo texto plano con párrafos separados por línea en blanco
- Máximo 350 palabras
`

interface SnapshotForAI {
  matchId: string
  fecha: string | null
  equipoLocal: string
  equipoLocalSigla: string | null
  equipoVisit: string
  equipoVisitSigla: string | null
  scoreLocal: number | null
  scoreVisit: number | null
  totalPuntos: number | null
  periodScores: Array<{ home: number; away: number }>
  estadoPartido: string | null
}

/**
 * Genera el análisis experto. Devuelve null si no hay API key configurada
 * o si la llamada falla — el caller debe manejar ese caso.
 */
export async function generateExpertSummary(
  snapshot: SnapshotForAI,
  patrones: DetectedPattern[],
  tier: JugadorTier[]
): Promise<{ summary: string; model: string } | null> {
  if (!anthropic) return null
  if (patrones.length === 0) return null  // sin patrones, no hay nada que analizar

  // Resumir info para el prompt
  const periodsLine = snapshot.periodScores
    .map((p, i) => `Q${i + 1}: ${p.home}-${p.away}`)
    .join(", ")
  const totalH1 = (snapshot.periodScores[0]?.home ?? 0) + (snapshot.periodScores[0]?.away ?? 0)
                + (snapshot.periodScores[1]?.home ?? 0) + (snapshot.periodScores[1]?.away ?? 0)
  const totalH2 = (snapshot.periodScores[2]?.home ?? 0) + (snapshot.periodScores[2]?.away ?? 0)
                + (snapshot.periodScores[3]?.home ?? 0) + (snapshot.periodScores[3]?.away ?? 0)

  const jugadoresTierEnPartido = patrones
    .flatMap((p) => p.jugadoresInvolucrados.filter((j) => j.tier))
    .filter((j, i, arr) => arr.findIndex((x) => x.nombre === j.nombre) === i)

  const userPrompt = `PARTIDO ANALIZADO

${snapshot.equipoLocal}${snapshot.equipoLocalSigla ? ` (${snapshot.equipoLocalSigla})` : ""} ${snapshot.scoreLocal ?? "–"} vs ${snapshot.scoreVisit ?? "–"} ${snapshot.equipoVisit}${snapshot.equipoVisitSigla ? ` (${snapshot.equipoVisitSigla})` : ""}
Match ID: ${snapshot.matchId}
Fecha: ${snapshot.fecha ?? "—"}
Estado: ${snapshot.estadoPartido ?? "—"}

SCORE POR CUARTO: ${periodsLine}
Total: ${snapshot.totalPuntos ?? "—"} puntos (1er tiempo: ${totalH1}, 2do tiempo: ${totalH2})

PATRONES DETECTADOS AUTOMÁTICAMENTE (${patrones.length}):
${patrones.map((p, i) => `${i + 1}. [${p.severidad}] ${p.tipoLabel}\n   ${p.descripcion}`).join("\n")}

JUGADORES TIER 1/2 (lista de monitoreo CPB) PRESENTES EN ESTE PARTIDO:
${jugadoresTierEnPartido.length > 0
  ? jugadoresTierEnPartido.map((j) => `- ${j.nombre} (${j.club}, ${j.tier})`).join("\n")
  : "Ninguno."}

LISTA TIER COMPLETA (referencia, total ${tier.length} jugadores):
${tier.slice(0, 10).map((j) => `- ${j.nombre} (${j.club}, ${j.tier})`).join("\n")}${tier.length > 10 ? `\n…y ${tier.length - 10} más.` : ""}

Generá el análisis experto siguiendo la estructura solicitada.`

  try {
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    })
    const text = message.content[0]?.type === "text" ? message.content[0].text : ""
    if (!text) return null
    return { summary: text.trim(), model: AI_MODEL }
  } catch (err) {
    console.error("[integridad-ai] generación falló:", err)
    return null
  }
}
