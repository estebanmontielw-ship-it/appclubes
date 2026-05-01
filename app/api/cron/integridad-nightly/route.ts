import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"
import { getSchedule } from "@/lib/genius-sports"
import { detectPatterns, esPartidoCritico, isMonitoredTeam, maxSeveridad } from "@/lib/integridad"
import type { JugadorTier } from "@/lib/integridad"
import { buildMatchSnapshot, inferStatusFromFiba } from "@/lib/integridad-fetch"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { emailIntegridadAnalisis } from "@/lib/email"

const INTEGRIDAD_NOTIFY_EMAIL = process.env.INTEGRIDAD_NOTIFY_EMAIL ?? "estebanmontielw@gmail.com"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 min — analizar varios partidos secuencial

/**
 * GET /api/cron/integridad-nightly
 *
 * Cron de Vercel que corre todos los días a las 06:00 UTC (ver vercel.json).
 *
 * Lógica:
 *   1. Trae el schedule de la competencia LNB
 *   2. Filtra los COMPLETE que involucren clubes monitoreados
 *   3. Para cada uno SIN análisis cacheado o con análisis no-COMPLETE,
 *      corre `buildMatchSnapshot` + `detectPatterns` y persiste.
 *
 * Auth: Vercel pasa header `Authorization: Bearer <CRON_SECRET>`.
 *       En desarrollo permitimos sin auth.
 */
export async function GET(request: Request) {
  try {
    // Auth de cron
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get("authorization")
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
      }
    }

    const { id: competitionId } = await resolveLnbCompetitionIdPublic()
    if (!competitionId) {
      return NextResponse.json(
        { error: "No se pudo resolver el ID de la competencia LNB." },
        { status: 500 }
      )
    }

    // 1. Schedule
    const raw: any = await getSchedule(competitionId)
    const matches: any[] = raw?.response?.data ?? raw?.data ?? []

    // 2. Pre-filtro: monitoreados con scores cargados
    const todayCron = new Date().toISOString().slice(0, 10)
    const candidatosPre = matches.filter((m) => {
      const homeC = m.competitors?.find((c: any) => c.isHomeCompetitor === 1) ?? m.competitors?.[0]
      const awayC = m.competitors?.find((c: any) => c.isHomeCompetitor === 0) ?? m.competitors?.[1]
      const sH = homeC?.scoreString ? parseInt(homeC.scoreString, 10) : null
      const sA = awayC?.scoreString ? parseInt(awayC.scoreString, 10) : null
      const tieneScores = sH != null && sA != null &&
        Number.isFinite(sH) && Number.isFinite(sA) && (sH > 0 || sA > 0)
      if (m.matchStatus !== "COMPLETE" && !tieneScores) return false

      const homeMonit = isMonitoredTeam(
        homeC?.competitorName ?? "",
        homeC?.teamCode ?? null
      )
      const awayMonit = isMonitoredTeam(
        awayC?.competitorName ?? "",
        awayC?.teamCode ?? null
      )
      return homeMonit || awayMonit
    })

    // 3. Para hoy: chequear FibaLiveStats (descartar IN_PROGRESS)
    const candidatos: any[] = []
    for (const m of candidatosPre) {
      if (m.matchStatus === "COMPLETE") {
        candidatos.push(m)
        continue
      }
      const matchTime: string = m.matchTime ?? ""
      const fechaPartido = matchTime.includes(" ") ? matchTime.split(" ")[0] : matchTime.slice(0, 10)
      const esEnElPasado = fechaPartido !== "" && fechaPartido < todayCron
      if (esEnElPasado) {
        candidatos.push(m)
        continue
      }
      const inferred = await inferStatusFromFiba(String(m.matchId))
      if (inferred === "COMPLETE") candidatos.push(m)
    }

    // 3. Identificar los que NO tienen análisis COMPLETE cacheado
    const cached = await prisma.integridadAnalisis.findMany({
      where: { matchId: { in: candidatos.map((c) => String(c.matchId)) } },
      select: { matchId: true, estadoPartido: true },
    })
    const cachedByMatch = new Map(cached.map((c) => [c.matchId, c]))

    const pendientes = candidatos.filter((m) => {
      const cur = cachedByMatch.get(String(m.matchId))
      return !cur || cur.estadoPartido !== "COMPLETE"
    })

    // 4. Cargar tier list una sola vez
    const tierRows = await prisma.integridadJugadorTier.findMany({ where: { activo: true } })
    const tier: JugadorTier[] = tierRows.map((t) => ({
      nombre: t.nombre, nombreNorm: t.nombreNorm, club: t.club,
      clubSigla: t.clubSigla, numero: t.numero, tier: t.tier,
    }))

    // 5. Analizar cada pendiente (secuencial para no saturar API)
    const resultados: Array<{
      matchId: string
      ok: boolean
      patrones?: number
      severidadMax?: string | null
      error?: string
    }> = []

    for (const m of pendientes) {
      const matchId = String(m.matchId)
      try {
        const snap = await buildMatchSnapshot(matchId)
        const patrones = detectPatterns(snap, tier)
        const sevMax = maxSeveridad(patrones)
        const fechaParsed = snap.fecha ? new Date(snap.fecha) : null
        const fecha = fechaParsed && !isNaN(fechaParsed.getTime()) ? fechaParsed : null

        await prisma.$transaction(async (tx) => {
          const upserted = await tx.integridadAnalisis.upsert({
            where: { matchId },
            create: {
              matchId,
              competicionId: snap.competicionId,
              competicionName: snap.competicionName,
              fecha,
              equipoLocal: snap.equipoLocal,
              equipoLocalSigla: snap.equipoLocalSigla,
              equipoVisit: snap.equipoVisit,
              equipoVisitSigla: snap.equipoVisitSigla,
              scoreLocal: snap.scoreLocal,
              scoreVisit: snap.scoreVisit,
              totalPuntos: snap.totalPuntos,
              periodScores: snap.periodScores as any,
              esCritico: esPartidoCritico(snap),
              totalPatrones: patrones.length,
              severidadMax: sevMax,
              rawData: snap as any,
              estadoPartido: snap.estadoPartido,
              generadoPor: "cron-nightly",
            },
            update: {
              fecha,
              scoreLocal: snap.scoreLocal,
              scoreVisit: snap.scoreVisit,
              totalPuntos: snap.totalPuntos,
              periodScores: snap.periodScores as any,
              totalPatrones: patrones.length,
              severidadMax: sevMax,
              rawData: snap as any,
              estadoPartido: snap.estadoPartido,
            },
          })
          await tx.integridadPatron.deleteMany({ where: { analisisId: upserted.id } })
          if (patrones.length > 0) {
            await tx.integridadPatron.createMany({
              data: patrones.map((p) => ({
                analisisId: upserted.id,
                tipo: p.tipo, tipoLabel: p.tipoLabel, severidad: p.severidad,
                descripcion: p.descripcion, datos: p.datos as any,
                jugadoresInvolucrados: p.jugadoresInvolucrados as any,
              })),
            })
          }
        })

        resultados.push({
          matchId, ok: true,
          patrones: patrones.length, severidadMax: sevMax,
        })

        // Email al admin si hay algo que reportar
        const tieneAlgoQueReportar = patrones.length > 0 || esPartidoCritico(snap)
        if (tieneAlgoQueReportar && INTEGRIDAD_NOTIFY_EMAIL) {
          emailIntegridadAnalisis(INTEGRIDAD_NOTIFY_EMAIL, {
            matchId,
            equipoLocal: snap.equipoLocal,
            equipoLocalSigla: snap.equipoLocalSigla,
            equipoVisit: snap.equipoVisit,
            equipoVisitSigla: snap.equipoVisitSigla,
            scoreLocal: snap.scoreLocal,
            scoreVisit: snap.scoreVisit,
            totalPuntos: snap.totalPuntos,
            esCritico: esPartidoCritico(snap),
            totalPatrones: patrones.length,
            severidadMax: sevMax,
            patrones: patrones.map((p) => ({
              tipoLabel: p.tipoLabel,
              severidad: p.severidad,
              descripcion: p.descripcion,
            })),
          }).catch(() => {})
        }
      } catch (err: any) {
        resultados.push({
          matchId, ok: false,
          error: err?.message ?? String(err),
        })
      }
    }

    // 6. Audit summary
    await prisma.integridadAuditLog.create({
      data: {
        accion: "cron_nightly",
        detalles: {
          totalCandidatos: candidatos.length,
          pendientesProcesados: pendientes.length,
          ok: resultados.filter((r) => r.ok).length,
          errores: resultados.filter((r) => !r.ok).length,
          conPatrones: resultados.filter((r) => r.ok && (r.patrones ?? 0) > 0).length,
        } as any,
      },
    })

    return NextResponse.json({
      ok: true,
      totalCandidatos: candidatos.length,
      pendientesProcesados: pendientes.length,
      resultados,
    })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/cron/integridad-nightly" })
  }
}
