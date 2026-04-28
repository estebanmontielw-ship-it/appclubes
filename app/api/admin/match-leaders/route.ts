import { NextRequest, NextResponse } from "next/server"
import {
  resolveLnbCompetitionIdPublic,
  resolveLnbfCompetitionIdPublic,
  resolveU22MCompetitionIdPublic,
  resolveU22FCompetitionIdPublic,
} from "@/lib/programacion-lnb"
import { geniusFetch } from "@/lib/genius-sports"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// GET /api/admin/match-leaders?matchId=X&liga=lnb&team=winner|loser|home|away
//
// Devuelve top 5 jugadores del partido (default: equipo ganador) con sus
// stats, foto de Genius (si existe) y data del equipo. Usado por el
// template "Jugador del Partido" del Diseñador V2 para reemplazar el
// armado manual de nombre/club/foto por una selección desde una grilla
// pre-cargada con los candidatos reales del partido.

interface PlayerLeader {
  personId: number
  playerName: string
  jerseyNumber: number | null
  photoUrl: string | null
  teamName: string
  teamSigla: string | null
  teamLogo: string | null
  isWinningTeam: boolean
  stats: {
    points: number
    rebounds: number
    assists: number
    minutes: number
    threePointersMade: number
    threePointersAttempted: number
    fieldGoalsMade: number
    fieldGoalsAttempted: number
    freeThrowsMade: number
    freeThrowsAttempted: number
    steals: number
    blocks: number
    efficiency: number | null
  }
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN
  return Number.isFinite(n) ? n : 0
}

function asUrl(v: unknown): string | null {
  if (typeof v !== "string") return null
  const t = v.trim()
  return t ? t : null
}

const RESOLVERS: Record<string, () => Promise<{ id: string | null; name: string | null }>> = {
  lnb:  resolveLnbCompetitionIdPublic,
  lnbf: resolveLnbfCompetitionIdPublic,
  u22m: resolveU22MCompetitionIdPublic,
  u22f: resolveU22FCompetitionIdPublic,
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const matchId = req.nextUrl.searchParams.get("matchId")
    const liga = req.nextUrl.searchParams.get("liga") ?? "lnb"
    const teamFilter = (req.nextUrl.searchParams.get("team") ?? "winner") as
      | "winner" | "loser" | "home" | "away" | "all"

    if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 })

    const resolve = RESOLVERS[liga] ?? RESOLVERS.lnb
    const { id: compId } = await resolve()
    if (!compId) return NextResponse.json({ error: `Competencia ${liga} no encontrada` }, { status: 404 })

    // Pull match meta para conocer competidores, scores y logos
    const allRaw = await geniusFetch(`/competitions/${compId}/matches?limit=100`, "short")
    const allMatches: any[] = allRaw?.response?.data ?? allRaw?.data ?? []
    const m = allMatches.find((x: any) => String(x.matchId) === String(matchId))
    if (!m) return NextResponse.json({ error: "Partido no encontrado en la competencia" }, { status: 404 })

    const competitors: any[] = Array.isArray(m.competitors) ? m.competitors : []
    const home = competitors.find((c: any) => Number(c.isHomeCompetitor) === 1) ?? competitors[0]
    const away = competitors.find((c: any) => Number(c.isHomeCompetitor) === 0) ?? competitors[1]
    if (!home || !away) return NextResponse.json({ error: "Partido sin competidores" }, { status: 422 })

    const homeScore = num(home.scoreString)
    const awayScore = num(away.scoreString)
    const homeWins  = homeScore > awayScore
    const awayWins  = awayScore > homeScore

    // teamId puede ser teamId o competitorId — Genius cambia entre endpoints
    const homeTeamId = Number(home.teamId ?? home.competitorId)
    const awayTeamId = Number(away.teamId ?? away.competitorId)

    function teamMeta(c: any, isWinner: boolean) {
      return {
        teamName:  asUrl(c.competitorName) ?? "",
        teamSigla: asUrl(c.teamCode) ?? null,
        teamLogo:
          asUrl(c.images?.logo?.L1?.url) ??
          asUrl(c.images?.logo?.S1?.url) ??
          asUrl(c.images?.logo?.T1?.url),
        isWinningTeam: isWinner,
      }
    }
    const homeMeta = teamMeta(home, homeWins)
    const awayMeta = teamMeta(away, awayWins)

    // Determinar qué equipos pedir según el filtro
    const wantHome =
      teamFilter === "all" ||
      teamFilter === "home" ||
      (teamFilter === "winner" && homeWins) ||
      (teamFilter === "loser"  && awayWins)
    const wantAway =
      teamFilter === "all" ||
      teamFilter === "away" ||
      (teamFilter === "winner" && awayWins) ||
      (teamFilter === "loser"  && homeWins)

    // Si el partido está empatado / NOT_COMPLETE no hay ganador — caemos
    // a "all" para que el cliente igual pueda elegir manualmente.
    const noWinner = !homeWins && !awayWins
    const fetchHome = wantHome || (noWinner && (teamFilter === "winner" || teamFilter === "loser"))
    const fetchAway = wantAway || (noWinner && (teamFilter === "winner" || teamFilter === "loser"))

    const fetchTeam = async (tid: number, meta: ReturnType<typeof teamMeta>) => {
      try {
        const raw = await geniusFetch(`/matches/${matchId}/teams/${tid}/players?limit=100`, "short")
        const list: any[] = raw?.response?.data ?? raw?.data ?? []
        return list.map((p: any) => ({ p, meta }))
      } catch { return [] }
    }
    const both = await Promise.all([
      fetchHome ? fetchTeam(homeTeamId, homeMeta) : Promise.resolve([]),
      fetchAway ? fetchTeam(awayTeamId, awayMeta) : Promise.resolve([]),
    ])
    const flat = both.flat()

    // Genius devuelve filas por período + un total con periodNumber=0.
    // Tomamos solo el total y los que efectivamente jugaron.
    const totals = flat.filter(({ p }) =>
      Number(p.periodNumber) === 0 &&
      (p.participated === 1 || p.participated === "1" ||
       (p.sMinutes != null && Number(p.sMinutes) > 0))
    )

    const leaders: PlayerLeader[] = totals.map(({ p, meta }) => ({
      personId: Number(p.personId),
      playerName: (p.personName ?? `${p.firstName ?? ""} ${p.familyName ?? ""}`).trim(),
      jerseyNumber: p.shirtNumber != null ? Number(p.shirtNumber) : (p.bib != null ? Number(p.bib) : null),
      photoUrl: asUrl(p.images?.photo?.T1?.url) ?? asUrl(p.images?.photo?.S1?.url),
      teamName: meta.teamName,
      teamSigla: meta.teamSigla,
      teamLogo: meta.teamLogo,
      isWinningTeam: meta.isWinningTeam,
      stats: {
        points:                num(p.sPoints),
        rebounds:              num(p.sReboundsTotal),
        assists:               num(p.sAssists),
        minutes:               num(p.sMinutes),
        threePointersMade:     num(p.sThreePointersMade),
        threePointersAttempted: num(p.sThreePointersAttempted),
        fieldGoalsMade:        num(p.sFieldGoalsMade ?? p.sTwoPointersMade),
        fieldGoalsAttempted:   num(p.sFieldGoalsAttempted ?? p.sTwoPointersAttempted),
        freeThrowsMade:        num(p.sFreeThrowsMade),
        freeThrowsAttempted:   num(p.sFreeThrowsAttempted),
        steals:                num(p.sSteals),
        blocks:                num(p.sBlocks),
        efficiency:            p.sEfficiency != null ? num(p.sEfficiency) : null,
      },
    }))

    // Ordenamos por puntos (desc), tomamos top 5 (o todos si team=all)
    leaders.sort((a, b) => b.stats.points - a.stats.points)
    const limit = teamFilter === "all" ? 12 : 5
    const top = leaders.slice(0, limit)

    return NextResponse.json({
      match: {
        matchId: Number(matchId),
        homeName: homeMeta.teamName,
        awayName: awayMeta.teamName,
        homeScore,
        awayScore,
        winner: homeWins ? "home" : awayWins ? "away" : null,
      },
      teamFilterApplied: teamFilter,
      players: top,
    })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/match-leaders" })
  }
}
