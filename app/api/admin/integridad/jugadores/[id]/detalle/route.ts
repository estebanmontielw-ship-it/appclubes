import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"
import { normalizeName, parseMinutes } from "@/lib/integridad"
import type { BoxscorePlayer, MatchSnapshot } from "@/lib/integridad"
import { getGameLog, discoverPersonId, resolveActiveLnbCompetition, type GameLogEntry } from "@/lib/jugador-stats"

export const dynamic = "force-dynamic"
export const maxDuration = 60

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
  rebOff: number; rebDef: number; reb: number; ast: number
  stl: number; blk: number
  to: number; pf: number; fr: number
  eff: number | null
  plusMinus: number | null
  pos: string | null
  starter: boolean; captain: boolean
  // Patrones detectados en este partido para este jugador
  patronesEnPartido: string[]
}

/** Encuentra al jugador dentro de un MatchSnapshot por nombre normalizado. */
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

function findPersonIdFromSnapshots(snapshots: any[], nombreNorm: string): number | null {
  for (const s of snapshots) {
    const snap = s.rawData as MatchSnapshot | null
    if (!snap) continue
    const found = findPlayerInSnapshot(snap, nombreNorm)
    if (found && found.player.personId != null) return found.player.personId
  }
  return null
}

/**
 * GET /api/admin/integridad/jugadores/[id]/detalle
 *
 * Devuelve dossier completo. Si el jugador tiene personId vinculado
 * (o lo descubrimos), usamos /api/website/jugador-partidos via el lib
 * para obtener el game log COMPLETO de la temporada (todos los partidos
 * de Genius, no solo los analizados).
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

    // 2. Cargar todos los análisis cacheados (para patrones + fallback)
    const todosLosAnalisis = await prisma.integridadAnalisis.findMany({
      orderBy: { fecha: "desc" },
      include: {
        patrones: { orderBy: { severidad: "desc" } },
      },
    })

    // 3. Resolver personId: primero el guardado, sino descubrir
    let personId: number | null = jugador.personId
    let personIdSource: "stored" | "snapshot" | "discovered" | null = personId ? "stored" : null

    if (!personId) {
      personId = findPersonIdFromSnapshots(todosLosAnalisis, jugador.nombreNorm)
      if (personId) personIdSource = "snapshot"
    }

    // Resolver el competition ID activo (con validación contra schedule)
    const { id: competitionId } = await resolveActiveLnbCompetition()

    if (!personId && competitionId) {
      try {
        personId = await discoverPersonId(jugador.nombreNorm, competitionId, jugador.clubSigla)
        if (personId) personIdSource = "discovered"
      } catch {
        personId = null
      }
    }

    // Persistir el personId encontrado para futuras llamadas
    if (personId && jugador.personId !== personId) {
      await prisma.integridadJugadorTier.update({
        where: { id: jugador.id },
        data: { personId },
      }).catch(() => {})
    }

    // 4. Si tenemos personId + competitionId, traer game log completo
    let gameLog: GameLogEntry[] = []
    if (personId && competitionId) {
      try {
        gameLog = await getGameLog(personId, competitionId)
      } catch {
        gameLog = []
      }
    }

    // 5. Stats agregadas — preferir game log de Genius, sino caer al snapshot
    const usaGameLog = gameLog.length > 0
    const games = usaGameLog ? gameLog.length : 0
    let statsAgregadas: any | null = null

    if (usaGameLog) {
      let mins = 0, pts = 0, fg2m = 0, fg2a = 0, fg3m = 0, fg3a = 0
      let ftm = 0, fta = 0, reb = 0, rebOff = 0, rebDef = 0
      let ast = 0, stl = 0, blk = 0, to = 0, pf = 0, fr = 0
      let eff = 0
      let ptsHigh = -Infinity, ptsLow = Infinity
      let starts = 0
      for (const g of gameLog) {
        const m = parseMinutes(g.min) ?? 0
        mins += m
        pts += g.pts
        ptsHigh = Math.max(ptsHigh, g.pts)
        ptsLow = Math.min(ptsLow, g.pts)
        fg2m += g.twoM; fg2a += g.twoA
        fg3m += g.threeM; fg3a += g.threeA
        ftm += g.ftM; fta += g.ftA
        reb += g.reb; rebOff += g.rebOff; rebDef += g.rebDef
        ast += g.ast; stl += g.stl; blk += g.blk
        to += g.to; pf += g.fp; fr += g.fr
        eff += g.eff ?? 0
      }
      const avg = (n: number) => Math.round((n / games) * 10) / 10
      statsAgregadas = {
        games,
        mins, minsAvg: avg(mins),
        pts, ptsAvg: avg(pts), ptsHigh: ptsHigh === -Infinity ? 0 : ptsHigh, ptsLow: ptsLow === Infinity ? 0 : ptsLow,
        fg2m, fg2a, fg2Pct: pct(fg2m, fg2a),
        fg3m, fg3a, fg3Pct: pct(fg3m, fg3a),
        ftm, fta, ftPct: pct(ftm, fta),
        reb, rebAvg: avg(reb), rebOff, rebDef,
        ast, astAvg: avg(ast),
        stl, stlAvg: avg(stl),
        blk, blkAvg: avg(blk),
        to, toAvg: avg(to),
        pf, pfAvg: avg(pf),
        fr,
        effAvg: games > 0 ? Math.round((eff / games) * 10) / 10 : 0,
        starts,
      }
    } else {
      // Fallback: usar snapshots cacheados
      const partidosDelJugador: { stats: BoxscorePlayer }[] = []
      for (const a of todosLosAnalisis) {
        const snap = a.rawData as MatchSnapshot | null
        if (!snap) continue
        const found = findPlayerInSnapshot(snap, jugador.nombreNorm)
        if (found) partidosDelJugador.push({ stats: found.player })
      }
      const gamesS = partidosDelJugador.length
      if (gamesS > 0) {
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
        const avg = (n: number) => Math.round((n / gamesS) * 10) / 10
        statsAgregadas = {
          games: gamesS,
          mins, minsAvg: avg(mins),
          pts, ptsAvg: avg(pts), ptsHigh: ptsHigh === -Infinity ? 0 : ptsHigh, ptsLow: ptsLow === Infinity ? 0 : ptsLow,
          fg2m, fg2a, fg2Pct: pct(fg2m, fg2a),
          fg3m, fg3a, fg3Pct: pct(fg3m, fg3a),
          ftm, fta, ftPct: pct(ftm, fta),
          reb, rebAvg: avg(reb), rebOff: 0, rebDef: 0,
          ast, astAvg: avg(ast),
          stl, stlAvg: avg(stl),
          blk, blkAvg: avg(blk),
          to, toAvg: avg(to),
          pf, pfAvg: avg(pf), fr: 0,
          effAvg: 0,
          starts,
        }
      }
    }

    // 6. Indexar análisis por matchId para correlacionar patrones
    const analisisByMatchId = new Map<string, typeof todosLosAnalisis[number]>()
    for (const a of todosLosAnalisis) analisisByMatchId.set(a.matchId, a)

    // 7. Lista de patrones donde aparece este jugador
    const patronesDelJugador: any[] = []
    for (const analisis of todosLosAnalisis) {
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

    // 8. Partidos recientes — preferir game log, sino snapshots
    let partidosRecientes: PlayerStatLine[]

    if (usaGameLog) {
      partidosRecientes = gameLog.slice(0, 10).map((g): PlayerStatLine => {
        const matchId = String(g.matchId)
        const analisis = analisisByMatchId.get(matchId)
        const patronesEnPartido = (analisis?.patrones ?? [])
          .filter((p) => {
            const involucrados = (p.jugadoresInvolucrados as Array<{ nombre: string }> | null) ?? []
            return involucrados.some((j) => normalizeName(j.nombre) === jugador.nombreNorm)
          })
          .map((p) => p.tipoLabel)

        const diferencia =
          g.myScore != null && g.oppScore != null ? g.myScore - g.oppScore : null
        const resultado: "GANADO" | "PERDIDO" | "EMPATE" | null =
          g.result === "W" ? "GANADO" : g.result === "L" ? "PERDIDO" : (diferencia === 0 ? "EMPATE" : null)

        return {
          matchId,
          fecha: g.date,
          oponente: g.oppName,
          oponenteSigla: g.oppSigla,
          esLocal: g.isHome,
          scorePropio: g.myScore,
          scoreOponente: g.oppScore,
          resultado,
          diferencia,
          mins: parseMinutes(g.min ?? ""),
          pts: g.pts,
          fg2m: g.twoM, fg2a: g.twoA, fg2Pct: g.twoPct,
          fg3m: g.threeM, fg3a: g.threeA, fg3Pct: g.threePct,
          ftm: g.ftM, fta: g.ftA, ftPct: g.ftPct,
          rebOff: g.rebOff, rebDef: g.rebDef, reb: g.reb,
          ast: g.ast,
          stl: g.stl, blk: g.blk,
          to: g.to, pf: g.fp, fr: g.fr,
          eff: g.eff,
          plusMinus: g.plusMinus,
          pos: g.pos,
          starter: false, captain: false,
          patronesEnPartido,
        }
      })
    } else {
      // Fallback: usar snapshots
      const fromSnapshots: PlayerStatLine[] = []
      for (const a of todosLosAnalisis.slice(0, 10)) {
        const snap = a.rawData as MatchSnapshot | null
        if (!snap) continue
        const found = findPlayerInSnapshot(snap, jugador.nombreNorm)
        if (!found) continue
        const { player: stats, equipo } = found
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
        fromSnapshots.push({
          matchId: a.matchId,
          fecha: a.fecha?.toISOString().slice(0, 10) ?? null,
          oponente, oponenteSigla, esLocal,
          scorePropio, scoreOponente, resultado, diferencia,
          mins: parseMinutes(stats.min),
          pts: stats.pts,
          fg2m: stats.fg2m, fg2a: stats.fg2a, fg2Pct: pct(stats.fg2m, stats.fg2a),
          fg3m: stats.fg3m, fg3a: stats.fg3a, fg3Pct: pct(stats.fg3m, stats.fg3a),
          ftm: stats.ftm, fta: stats.fta, ftPct: pct(stats.ftm, stats.fta),
          rebOff: 0, rebDef: 0, reb: stats.reb,
          ast: stats.ast, stl: stats.stl, blk: stats.blk,
          to: stats.to, pf: stats.pf, fr: 0,
          eff: null, plusMinus: null, pos: null,
          starter: stats.starter, captain: stats.captain,
          patronesEnPartido,
        })
      }
      partidosRecientes = fromSnapshots
    }

    return NextResponse.json({
      jugador: { ...jugador, personId },
      personIdSource,
      statsAgregadas,
      patrones: patronesDelJugador,
      partidosRecientes,
      datos: usaGameLog ? "genius_warehouse" : "snapshots_cacheados",
    })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/integridad/jugadores/[id]/detalle" })
  }
}
