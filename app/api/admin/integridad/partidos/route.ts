import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"
import { getSchedule } from "@/lib/genius-sports"
import { isMonitoredTeam, MONITORED_TEAMS } from "@/lib/integridad"
import { inferStatusFromFiba } from "@/lib/integridad-fetch"

export const dynamic = "force-dynamic"

async function requireSuperAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
  })
  if (adminRoles.length === 0) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }
  return { user }
}

/**
 * GET /api/admin/integridad/partidos
 *   ?competitionId=48603  (opcional — default: GENIUS_LNB_COMPETITION_ID)
 *   ?todos=1              (opcional — devuelve todos, no solo monitoreados)
 *
 * Devuelve los partidos de la competencia, con flags `esMonitoreado` y
 * `esCritico` (2 monitoreados se enfrentan), e indica si ya hay un
 * `IntegridadAnalisis` cacheado.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const competitionId = url.searchParams.get("competitionId")
      ?? process.env.GENIUS_LNB_COMPETITION_ID
    const todos = url.searchParams.get("todos") === "1"

    if (!competitionId) {
      return NextResponse.json(
        { error: "Falta competitionId (definí GENIUS_LNB_COMPETITION_ID o pasalo por query)" },
        { status: 400 }
      )
    }

    const raw: any = await getSchedule(competitionId)
    const matches: any[] = raw?.response?.data ?? raw?.data ?? []

    const matchIds = matches.map((m) => String(m.matchId)).filter(Boolean)
    const cached = matchIds.length
      ? await prisma.integridadAnalisis.findMany({
          where: { matchId: { in: matchIds } },
          select: {
            matchId: true,
            totalPatrones: true,
            severidadMax: true,
            esCritico: true,
            generadoEn: true,
          },
        })
      : []
    const cacheByMatchId = new Map(cached.map((c) => [c.matchId, c]))

    const enriched = matches.map((m) => {
      const homeC = m.competitors?.find((c: any) => c.isHomeCompetitor === 1) ?? m.competitors?.[0]
      const awayC = m.competitors?.find((c: any) => c.isHomeCompetitor === 0) ?? m.competitors?.[1]
      const homeName: string = homeC?.competitorName ?? "Local"
      const awayName: string = awayC?.competitorName ?? "Visitante"
      const homeSigla: string | null = homeC?.teamCode ?? null
      const awaySigla: string | null = awayC?.teamCode ?? null
      const homeMonit = isMonitoredTeam(homeName, homeSigla)
      const awayMonit = isMonitoredTeam(awayName, awaySigla)
      const esMonitoreado = homeMonit || awayMonit
      const esCritico = homeMonit && awayMonit

      const matchTime: string = m.matchTime ?? ""
      const [fecha, hora] = matchTime.includes(" ")
        ? matchTime.split(" ")
        : [matchTime, null]

      const scoreLocal = homeC?.scoreString ? parseInt(homeC.scoreString, 10) : null
      const scoreVisit = awayC?.scoreString ? parseInt(awayC.scoreString, 10) : null
      const estadoOriginal = m.matchStatus ?? null
      const tieneScoresFinales =
        scoreLocal != null && scoreVisit != null &&
        Number.isFinite(scoreLocal) && Number.isFinite(scoreVisit) &&
        (scoreLocal > 0 || scoreVisit > 0)

      // Estado inferido del schedule (sin tocar FibaLiveStats todavía):
      //   - COMPLETE / IN_PROGRESS / EN_CURSO de Genius → respetamos
      //   - Para SCHEDULED solo override a COMPLETE si la fecha está en
      //     el pasado (evita marcar COMPLETE a partidos en curso de HOY)
      const today = new Date().toISOString().slice(0, 10)
      const fechaPartido = fecha ?? ""
      const esEnElPasado = fechaPartido !== "" && fechaPartido < today
      let estado = estadoOriginal
      if (estadoOriginal === "COMPLETE" || estadoOriginal === "IN_PROGRESS" || estadoOriginal === "EN_CURSO") {
        estado = estadoOriginal
      } else if (esEnElPasado && tieneScoresFinales) {
        estado = "COMPLETE"
      }
      // (los partidos de HOY se chequean contra FibaLiveStats más abajo)

      return {
        matchId: String(m.matchId),
        matchNumber: m.matchNumber ?? null,
        fecha: fecha || null,
        hora: hora ? String(hora).slice(0, 5) : null,
        estado,
        estadoOriginal,
        equipoLocal: homeName,
        equipoLocalSigla: homeSigla,
        equipoLocalLogo: homeC?.images?.logo?.T1?.url ?? homeC?.images?.logo?.S1?.url ?? null,
        equipoVisit: awayName,
        equipoVisitSigla: awaySigla,
        equipoVisitLogo: awayC?.images?.logo?.T1?.url ?? awayC?.images?.logo?.S1?.url ?? null,
        scoreLocal,
        scoreVisit,
        esMonitoreado,
        esCritico,
        analisis: cacheByMatchId.get(String(m.matchId)) ?? null,
      }
    })

    // Para partidos de HOY que figuran SCHEDULED en Genius, consultar
    // FibaLiveStats para detectar si están EN VIVO o ya terminaron.
    // Lo hacemos solo para los monitoreados — limita las requests.
    const today = new Date().toISOString().slice(0, 10)
    const candidatosLive = enriched.filter(
      (p) => p.esMonitoreado && p.fecha === today && p.estado !== "COMPLETE" && p.estado !== "IN_PROGRESS"
    )
    if (candidatosLive.length > 0) {
      const checks = await Promise.all(
        candidatosLive.map(async (p) => ({
          matchId: p.matchId,
          inferredStatus: await inferStatusFromFiba(p.matchId),
        }))
      )
      const statusMap = new Map(checks.map((c) => [c.matchId, c.inferredStatus]))
      for (const p of enriched) {
        const inferred = statusMap.get(p.matchId)
        if (inferred) p.estado = inferred
      }
    }

    const filtered = todos ? enriched : enriched.filter((p) => p.esMonitoreado)
    filtered.sort((a, b) => {
      // Más recientes primero, críticos arriba dentro de la misma fecha
      const fa = a.fecha ?? ""
      const fb = b.fecha ?? ""
      if (fa !== fb) return fb.localeCompare(fa)
      if (a.esCritico !== b.esCritico) return a.esCritico ? -1 : 1
      return 0
    })

    // Contador de pendientes: monitoreados + finalizados sin análisis
    const pendientesAnalisis = enriched.filter(
      (p) => p.esMonitoreado && p.estado === "COMPLETE" && !p.analisis
    ).length

    return NextResponse.json({
      competitionId,
      monitoreados: MONITORED_TEAMS,
      total: enriched.length,
      mostrados: filtered.length,
      pendientesAnalisis,
      partidos: filtered,
    })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/integridad/partidos" })
  }
}
