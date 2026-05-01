import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"
import { getSchedule } from "@/lib/genius-sports"
import { detectPatterns, esPartidoCritico, isMonitoredTeam, maxSeveridad } from "@/lib/integridad"
import type { JugadorTier } from "@/lib/integridad"
import { buildMatchSnapshot, inferStatusFromFiba } from "@/lib/integridad-fetch"
import { emailIntegridadAnalisis } from "@/lib/email"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const INTEGRIDAD_NOTIFY_EMAIL = process.env.INTEGRIDAD_NOTIFY_EMAIL ?? "estebanmontielw@gmail.com"

async function requireSuperAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  const u = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, roles: { select: { rol: true } } },
  })
  const isAdmin = u?.roles.some((r) => r.rol === "SUPER_ADMIN")
  if (!u || !isAdmin) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }
  return { user: u }
}

/**
 * POST /api/admin/integridad/bulk-analyze
 *   ?force=1   → reanaliza incluso si ya hay análisis cacheado
 *
 * Versión manual del cron nightly. Analiza TODOS los partidos
 * monitoreados con scores cargados que aún no tengan análisis
 * COMPLETE en la base. Útil para hacer backfill de toda la
 * temporada y enriquecer los dossiers de jugadores.
 *
 * Devuelve { total, procesados, errores, resultados[] }.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const force = url.searchParams.get("force") === "1"
    const sendEmails = url.searchParams.get("sendEmails") !== "0"

    const competitionId = process.env.GENIUS_LNB_COMPETITION_ID
    if (!competitionId) {
      return NextResponse.json(
        { error: "Falta GENIUS_LNB_COMPETITION_ID" },
        { status: 500 }
      )
    }

    // 1. Schedule
    const raw: any = await getSchedule(competitionId)
    const matches: any[] = raw?.response?.data ?? raw?.data ?? []

    // 2. Pre-filtro: monitoreados con scores cargados
    //    (descartamos los que no se jugaron todavía sin tocar FibaLiveStats)
    const todayBulk = new Date().toISOString().slice(0, 10)
    const candidatosPre = matches.filter((m) => {
      const homeC = m.competitors?.find((c: any) => c.isHomeCompetitor === 1) ?? m.competitors?.[0]
      const awayC = m.competitors?.find((c: any) => c.isHomeCompetitor === 0) ?? m.competitors?.[1]
      const sH = homeC?.scoreString ? parseInt(homeC.scoreString, 10) : null
      const sA = awayC?.scoreString ? parseInt(awayC.scoreString, 10) : null
      const tieneScores = sH != null && sA != null &&
        Number.isFinite(sH) && Number.isFinite(sA) && (sH > 0 || sA > 0)
      if (m.matchStatus !== "COMPLETE" && !tieneScores) return false
      const homeMonit = isMonitoredTeam(homeC?.competitorName ?? "", homeC?.teamCode ?? null)
      const awayMonit = isMonitoredTeam(awayC?.competitorName ?? "", awayC?.teamCode ?? null)
      return homeMonit || awayMonit
    })

    // 3. Para cada candidato de HOY que NO esté COMPLETE en Genius,
    //    chequear FibaLiveStats. Si está IN_PROGRESS lo descartamos.
    //    Si Genius dice COMPLETE o el partido es del pasado, lo procesamos.
    const candidatos: any[] = []
    for (const m of candidatosPre) {
      if (m.matchStatus === "COMPLETE") {
        candidatos.push(m)
        continue
      }
      const matchTime: string = m.matchTime ?? ""
      const fechaPartido = matchTime.includes(" ") ? matchTime.split(" ")[0] : matchTime.slice(0, 10)
      const esEnElPasado = fechaPartido !== "" && fechaPartido < todayBulk
      if (esEnElPasado) {
        candidatos.push(m)
        continue
      }
      // Es de hoy con scores: chequear FibaLiveStats
      const inferred = await inferStatusFromFiba(String(m.matchId))
      if (inferred === "COMPLETE") candidatos.push(m)
      // si está IN_PROGRESS o null (no empezó), saltar
    }

    // 3. Identificar pendientes (sin análisis COMPLETE cacheado)
    const cached = await prisma.integridadAnalisis.findMany({
      where: { matchId: { in: candidatos.map((c) => String(c.matchId)) } },
      select: { matchId: true, estadoPartido: true },
    })
    const cachedByMatch = new Map(cached.map((c) => [c.matchId, c]))

    const pendientes = candidatos.filter((m) => {
      if (force) return true
      const cur = cachedByMatch.get(String(m.matchId))
      return !cur || cur.estadoPartido !== "COMPLETE"
    })

    // 4. Cargar tier list
    const tierRows = await prisma.integridadJugadorTier.findMany({ where: { activo: true } })
    const tier: JugadorTier[] = tierRows.map((t) => ({
      nombre: t.nombre, nombreNorm: t.nombreNorm, club: t.club,
      clubSigla: t.clubSigla, numero: t.numero, tier: t.tier,
    }))

    // 5. Procesar cada pendiente
    const resultados: Array<{
      matchId: string
      partido: string
      ok: boolean
      patrones?: number
      severidadMax?: string | null
      esCritico?: boolean
      error?: string
    }> = []

    for (const m of pendientes) {
      const matchId = String(m.matchId)
      const homeC = m.competitors?.find((c: any) => c.isHomeCompetitor === 1) ?? m.competitors?.[0]
      const awayC = m.competitors?.find((c: any) => c.isHomeCompetitor === 0) ?? m.competitors?.[1]
      const partidoLabel = `${homeC?.competitorName ?? "?"} vs ${awayC?.competitorName ?? "?"}`

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
              generadoPor: auth.user!.id,
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
          matchId, partido: partidoLabel, ok: true,
          patrones: patrones.length, severidadMax: sevMax,
          esCritico: esPartidoCritico(snap),
        })

        // Email solo si hay algo que reportar Y el usuario lo quiere
        if (sendEmails && (patrones.length > 0 || esPartidoCritico(snap)) && INTEGRIDAD_NOTIFY_EMAIL) {
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
          matchId, partido: partidoLabel, ok: false,
          error: err?.message ?? String(err),
        })
      }
    }

    // 6. Audit log
    await prisma.integridadAuditLog.create({
      data: {
        accion: force ? "bulk_reanalisis" : "bulk_analisis",
        userId: auth.user!.id,
        userEmail: auth.user!.email,
        detalles: {
          totalCandidatos: candidatos.length,
          pendientes: pendientes.length,
          ok: resultados.filter((r) => r.ok).length,
          errores: resultados.filter((r) => !r.ok).length,
          conPatrones: resultados.filter((r) => r.ok && (r.patrones ?? 0) > 0).length,
          force,
          sendEmails,
        } as any,
      },
    })

    return NextResponse.json({
      total: candidatos.length,
      procesados: pendientes.length,
      ok: resultados.filter((r) => r.ok).length,
      errores: resultados.filter((r) => !r.ok).length,
      resultados,
    })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/admin/integridad/bulk-analyze" })
  }
}
