import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"
import { detectPatterns, esPartidoCritico, maxSeveridad } from "@/lib/integridad"
import type { JugadorTier } from "@/lib/integridad"
import { buildMatchSnapshot, buildLiveSnapshotFromFiba } from "@/lib/integridad-fetch"
import { emailIntegridadAnalisis } from "@/lib/email"

const INTEGRIDAD_NOTIFY_EMAIL = process.env.INTEGRIDAD_NOTIFY_EMAIL ?? "estebanmontielw@gmail.com"

export const dynamic = "force-dynamic"

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

/** GET — devuelve el análisis cacheado (si existe) sin tocar el API. */
export async function GET(
  _req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const analisis = await prisma.integridadAnalisis.findUnique({
      where: { matchId: params.matchId },
      include: {
        patrones: {
          orderBy: [{ severidad: "desc" }, { createdAt: "asc" }],
        },
      },
    })

    if (!analisis) {
      return NextResponse.json({ analisis: null }, { status: 200 })
    }
    return NextResponse.json({ analisis })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/integridad/analisis/[matchId]" })
  }
}

/**
 * POST — analiza el partido (fetchea datos + corre detectores) y persiste
 * el resultado. Si ya hay análisis cacheado y no se pasa `force=1`, lo
 * devuelve sin volver a tocar el API.
 */
export async function POST(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const url = new URL(req.url)
    const force = url.searchParams.get("force") === "1"
    const mode = url.searchParams.get("mode") === "live" ? "live" : "full"

    const existing = await prisma.integridadAnalisis.findUnique({
      where: { matchId: params.matchId },
      include: {
        patrones: { orderBy: [{ severidad: "desc" }, { createdAt: "asc" }] },
      },
    })
    // Cache permanente para partidos finalizados — sólo recalcula con force=1
    if (existing && existing.estadoPartido === "COMPLETE" && !force && mode !== "live") {
      return NextResponse.json({ analisis: existing, cached: true })
    }

    // 1. Fetchear datos del partido
    //    - mode=live → solo FibaLiveStats (cero quota Genius)
    //    - mode=full → Genius + FibaLiveStats (canónico)
    const snap = mode === "live"
      ? await buildLiveSnapshotFromFiba(params.matchId)
      : await buildMatchSnapshot(params.matchId)
    if (!snap) {
      return NextResponse.json(
        { error: "FibaLiveStats todavía no tiene datos del partido" },
        { status: 404 }
      )
    }

    // 2. Cargar jugadores tier activos
    const tierRows = await prisma.integridadJugadorTier.findMany({
      where: { activo: true },
    })
    const tier: JugadorTier[] = tierRows.map((t) => ({
      nombre: t.nombre,
      nombreNorm: t.nombreNorm,
      club: t.club,
      clubSigla: t.clubSigla,
      numero: t.numero,
      tier: t.tier,
    }))

    // 3. Detectar patrones (lógica pura)
    const patrones = detectPatterns(snap, tier)
    const sevMax = maxSeveridad(patrones)
    const fechaParsed = snap.fecha ? new Date(snap.fecha) : null
    const fecha = fechaParsed && !isNaN(fechaParsed.getTime()) ? fechaParsed : null

    // 4. Persistir (upsert + reemplazar patrones)
    const analisis = await prisma.$transaction(async (tx) => {
      const upserted = await tx.integridadAnalisis.upsert({
        where: { matchId: params.matchId },
        create: {
          matchId: params.matchId,
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
        },
      })

      await tx.integridadPatron.deleteMany({ where: { analisisId: upserted.id } })

      if (patrones.length > 0) {
        await tx.integridadPatron.createMany({
          data: patrones.map((p) => ({
            analisisId: upserted.id,
            tipo: p.tipo,
            tipoLabel: p.tipoLabel,
            severidad: p.severidad,
            descripcion: p.descripcion,
            datos: p.datos as any,
            jugadoresInvolucrados: p.jugadoresInvolucrados as any,
          })),
        })
      }

      return tx.integridadAnalisis.findUnique({
        where: { id: upserted.id },
        include: { patrones: { orderBy: [{ severidad: "desc" }, { createdAt: "asc" }] } },
      })
    })

    // 5. Audit log (solo full — el live se loguea cada 60s, mucho ruido)
    if (mode !== "live") {
      await prisma.integridadAuditLog.create({
        data: {
          matchId: params.matchId,
          accion: force ? "reanalizar" : "analizar",
          userId: auth.user!.id,
          userEmail: auth.user!.email,
          detalles: { totalPatrones: patrones.length, severidadMax: sevMax } as any,
        },
      })
    }

    // 6. Email al admin si el partido finalizó y hay algo que reportar
    //    Solo dispara cuando el partido pasó a COMPLETE en este análisis.
    //    Para evitar spam, requerimos: patrones detectados o partido crítico.
    const transitionToComplete =
      snap.estadoPartido === "COMPLETE" &&
      (existing?.estadoPartido !== "COMPLETE" || force)
    const tieneAlgoQueReportar = patrones.length > 0 || esPartidoCritico(snap)

    if (transitionToComplete && tieneAlgoQueReportar && INTEGRIDAD_NOTIFY_EMAIL) {
      emailIntegridadAnalisis(INTEGRIDAD_NOTIFY_EMAIL, {
        matchId: params.matchId,
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

    return NextResponse.json({ analisis, cached: false })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/admin/integridad/analisis/[matchId]" })
  }
}
