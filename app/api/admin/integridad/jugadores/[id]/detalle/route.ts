import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"
import { normalizeName, parseMinutes } from "@/lib/integridad"
import type { BoxscorePlayer, MatchSnapshot } from "@/lib/integridad"

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

interface PlayerStatLine {
  matchId: string
  fecha: string | null
  oponente: string
  oponenteSigla: string | null
  esLocal: boolean
  scorePropio: number | null
  scoreOponente: number | null
  resultado: "GANADO" | "PERDIDO" | "EMPATE" | null
  diferencia: number | null
  // Stats individuales
  mins: number | null
  pts: number
  fg2m: number; fg2a: number; fg2Pct: number | null
  fg3m: number; fg3a: number; fg3Pct: number | null
  ftm: number; fta: number; ftPct: number | null
  reb: number; ast: number
  stl: number; blk: number
  to: number; pf: number
  starter: boolean; captain: boolean
  // Patrones detectados en este partido para este jugador
  patronesEnPartido: string[]
}

/**
 * Encuentra al jugador dentro de un MatchSnapshot (por nombre normalizado)
 * y devuelve { player, equipo: "home"|"away" } o null si no jugó.
 */
function findPlayerInSnapshot(
  snap: MatchSnapshot,
  nombreNorm: string
): { player: BoxscorePlayer; equipo: "home" | "away" } | null {
  for (const p of snap.home.players) {
    if (normalizeName(p.name) === nombreNorm) return { player: p, equipo: "home" }
  }
  for (const p of snap.away.players) {
    if (normalizeName(p.name) === nombreNorm) return { player: p, equipo: "away" }
  }
  return null
}

function pct(made: number, att: number): number | null {
  if (att === 0) return null
  return Math.round((made / att) * 1000) / 10
}

/**
 * GET /api/admin/integridad/jugadores/[id]/detalle
 *
 * Devuelve dossier completo del jugador para análisis:
 *   - Datos de identidad y notas
 *   - Stats agregadas LNB (extraídas de los análisis cacheados — cero quota)
 *   - Patrones históricos donde aparece
 *   - Últimos 10 partidos con stats individuales
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    // 1. Cargar el jugador tier
    const jugador = await prisma.integridadJugadorTier.findUnique({
      where: { id: params.id },
    })
    if (!jugador) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 })
    }

    // 2. Cargar TODOS los análisis donde participó este jugador
    //    Filtramos en JS porque el match es por nombre dentro del JSON rawData
    const todosLosAnalisis = await prisma.integridadAnalisis.findMany({
      orderBy: { fecha: "desc" },
      include: {
        patrones: { orderBy: { severidad: "desc" } },
      },
    })

    const partidosDelJugador: Array<{
      analisis: (typeof todosLosAnalisis)[number]
      stats: BoxscorePlayer
      equipo: "home" | "away"
    }> = []

    for (const a of todosLosAnalisis) {
      const snap = a.rawData as MatchSnapshot | null
      if (!snap) continue
      const found = findPlayerInSnapshot(snap, jugador.nombreNorm)
      if (found) {
        partidosDelJugador.push({ analisis: a, stats: found.player, equipo: found.equipo })
      }
    }

    // 3. Calcular stats agregadas
    const games = partidosDelJugador.length
    let statsAgregadas: {
      games: number
      mins: number; minsAvg: number
      pts: number; ptsAvg: number; ptsHigh: number; ptsLow: number
      fg2m: number; fg2a: number; fg2Pct: number | null
      fg3m: number; fg3a: number; fg3Pct: number | null
      ftm: number; fta: number; ftPct: number | null
      reb: number; rebAvg: number
      ast: number; astAvg: number
      stl: number; stlAvg: number
      blk: number; blkAvg: number
      to: number; toAvg: number
      pf: number; pfAvg: number
      starts: number
    } | null = null

    if (games > 0) {
      let mins = 0, pts = 0, fg2m = 0, fg2a = 0, fg3m = 0, fg3a = 0
      let ftm = 0, fta = 0, reb = 0, ast = 0, stl = 0, blk = 0, to = 0, pf = 0
      let starts = 0
      let ptsHigh = -Infinity, ptsLow = Infinity

      for (const { stats } of partidosDelJugador) {
        const m = parseMinutes(stats.min) ?? 0
        mins += m
        pts += stats.pts
        ptsHigh = Math.max(ptsHigh, stats.pts)
        ptsLow = Math.min(ptsLow, stats.pts)
        fg2m += stats.fg2m; fg2a += stats.fg2a
        fg3m += stats.fg3m; fg3a += stats.fg3a
        ftm += stats.ftm; fta += stats.fta
        reb += stats.reb; ast += stats.ast
        stl += stats.stl; blk += stats.blk
        to += stats.to; pf += stats.pf
        if (stats.starter) starts++
      }

      const avg = (n: number) => Math.round((n / games) * 10) / 10

      statsAgregadas = {
        games,
        mins, minsAvg: avg(mins),
        pts, ptsAvg: avg(pts), ptsHigh: ptsHigh === -Infinity ? 0 : ptsHigh, ptsLow: ptsLow === Infinity ? 0 : ptsLow,
        fg2m, fg2a, fg2Pct: pct(fg2m, fg2a),
        fg3m, fg3a, fg3Pct: pct(fg3m, fg3a),
        ftm, fta, ftPct: pct(ftm, fta),
        reb, rebAvg: avg(reb),
        ast, astAvg: avg(ast),
        stl, stlAvg: avg(stl),
        blk, blkAvg: avg(blk),
        to, toAvg: avg(to),
        pf, pfAvg: avg(pf),
        starts,
      }
    }

    // 4. Lista de patrones donde aparece este jugador (en orden por fecha desc)
    const patronesDelJugador: Array<{
      patronId: string
      tipo: string
      tipoLabel: string
      severidad: string
      descripcion: string
      partido: {
        matchId: string
        fecha: Date | null
        equipoLocal: string
        equipoVisit: string
        scoreLocal: number | null
        scoreVisit: number | null
      }
    }> = []

    for (const { analisis } of partidosDelJugador) {
      for (const p of analisis.patrones) {
        const involucrados = (p.jugadoresInvolucrados as Array<{ nombre: string }> | null) ?? []
        const aparece = involucrados.some((j) => normalizeName(j.nombre) === jugador.nombreNorm)
        if (!aparece) continue
        patronesDelJugador.push({
          patronId: p.id,
          tipo: p.tipo,
          tipoLabel: p.tipoLabel,
          severidad: p.severidad,
          descripcion: p.descripcion,
          partido: {
            matchId: analisis.matchId,
            fecha: analisis.fecha,
            equipoLocal: analisis.equipoLocal,
            equipoVisit: analisis.equipoVisit,
            scoreLocal: analisis.scoreLocal,
            scoreVisit: analisis.scoreVisit,
          },
        })
      }
    }

    // 5. Últimos 10 partidos con stats line-by-line
    const partidosRecientes: PlayerStatLine[] = partidosDelJugador
      .slice(0, 10)
      .map(({ analisis: a, stats, equipo }) => {
        const esLocal = equipo === "home"
        const oponente = esLocal ? a.equipoVisit : a.equipoLocal
        const oponenteSigla = esLocal ? a.equipoVisitSigla : a.equipoLocalSigla
        const scorePropio = esLocal ? a.scoreLocal : a.scoreVisit
        const scoreOponente = esLocal ? a.scoreVisit : a.scoreLocal
        let resultado: "GANADO" | "PERDIDO" | "EMPATE" | null = null
        let diferencia: number | null = null
        if (scorePropio != null && scoreOponente != null) {
          diferencia = scorePropio - scoreOponente
          if (diferencia > 0) resultado = "GANADO"
          else if (diferencia < 0) resultado = "PERDIDO"
          else resultado = "EMPATE"
        }

        const patronesEnPartido = a.patrones
          .filter((p) => {
            const involucrados = (p.jugadoresInvolucrados as Array<{ nombre: string }> | null) ?? []
            return involucrados.some((j) => normalizeName(j.nombre) === jugador.nombreNorm)
          })
          .map((p) => p.tipoLabel)

        return {
          matchId: a.matchId,
          fecha: a.fecha?.toISOString().slice(0, 10) ?? null,
          oponente, oponenteSigla, esLocal,
          scorePropio, scoreOponente, resultado, diferencia,
          mins: parseMinutes(stats.min),
          pts: stats.pts,
          fg2m: stats.fg2m, fg2a: stats.fg2a, fg2Pct: pct(stats.fg2m, stats.fg2a),
          fg3m: stats.fg3m, fg3a: stats.fg3a, fg3Pct: pct(stats.fg3m, stats.fg3a),
          ftm: stats.ftm, fta: stats.fta, ftPct: pct(stats.ftm, stats.fta),
          reb: stats.reb, ast: stats.ast,
          stl: stats.stl, blk: stats.blk,
          to: stats.to, pf: stats.pf,
          starter: stats.starter, captain: stats.captain,
          patronesEnPartido,
        }
      })

    return NextResponse.json({
      jugador,
      statsAgregadas,
      patrones: patronesDelJugador,
      partidosRecientes,
    })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/integridad/jugadores/[id]/detalle" })
  }
}
