import { NextResponse } from "next/server"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { geniusFetch, getStandings, getAllPlayerStats } from "@/lib/genius-sports"
import { handleApiError } from "@/lib/api-errors"

export const revalidate = 300

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")
    if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 })

    const { id: competitionId } = await resolveLnbCompetitionIdPublic()
    if (!competitionId) return NextResponse.json({ error: "Sin competencia activa" }, { status: 404 })

    const [matchesRaw, standingsRaw, statsData] = await Promise.all([
      geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "medium"),
      getStandings(competitionId).catch(() => null),
      getAllPlayerStats(competitionId).catch(() => ({ players: [], teams: [] })),
    ])

    const allMatches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
    const rawMatch = allMatches.find((m: any) => String(m.matchId) === String(matchId))
    if (!rawMatch) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 })

    const competitors: any[] = rawMatch.competitors ?? []
    const homeComp = competitors.find((c: any) => Number(c.isHomeCompetitor) === 1) ?? competitors[0]
    const awayComp = competitors.find((c: any) => Number(c.isHomeCompetitor) === 0) ?? competitors[1]
    const homeId = homeComp?.teamId ?? homeComp?.competitorId
    const awayId = awayComp?.teamId ?? awayComp?.competitorId

    const [datePart, timeRaw] = (rawMatch.matchTime ?? "").split(" ")
    const timePart = timeRaw?.slice(0, 5) ?? null
    const getLogo = (c: any) => c?.images?.logo?.T1?.url ?? c?.images?.logo?.S1?.url ?? null

    // Standings helper
    const standingItems: any[] = standingsRaw?.response?.data ?? standingsRaw?.data ?? []
    const extractStanding = (tid: any) => {
      const row = standingItems.find((s: any) => {
        const c = s.competitor ?? s.team ?? s
        return String(c.competitorId ?? c.teamId ?? c.id) === String(tid)
      })
      if (!row) return null
      const st = row.stats ?? row
      const wins = st.wins ?? st.won ?? 0
      const losses = st.losses ?? st.lost ?? 0
      const played = st.gamesPlayed ?? st.played ?? wins + losses
      return {
        position: row.rank ?? row.position ?? null,
        gamesPlayed: played,
        wins, losses,
        winPct: played > 0 ? Math.round((wins / played) * 1000) / 10 : null,
        pointsFor: st.scoredFor ?? st.pointsFor ?? null,
        pointsAgainst: st.scoredAgainst ?? st.pointsAgainst ?? null,
        pointDiff: st.pointsDiff ?? st.pointDifferential ??
          (st.scoredFor != null && st.scoredAgainst != null ? st.scoredFor - st.scoredAgainst : null),
      }
    }

    // Recent form helper
    const completed = allMatches.filter((m: any) => m.matchStatus === "COMPLETE")

    const getForm = (tid: any, limit = 5) => {
      return completed
        .filter((m: any) => m.competitors?.some((c: any) => String(c.teamId ?? c.competitorId) === String(tid)))
        .sort((a: any, b: any) => (b.matchTime ?? "").localeCompare(a.matchTime ?? ""))
        .slice(0, limit)
        .map((m: any) => {
          const comps: any[] = m.competitors ?? []
          const mine = comps.find((c: any) => String(c.teamId ?? c.competitorId) === String(tid))
          const opp = comps.find((c: any) => String(c.teamId ?? c.competitorId) !== String(tid))
          const myScore = parseInt(mine?.scoreString ?? "") || 0
          const oppScore = parseInt(opp?.scoreString ?? "") || 0
          return {
            date: (m.matchTime ?? "").split(" ")[0] ?? null,
            myScore, oppScore,
            oppName: opp?.competitorName ?? opp?.teamName ?? "?",
            oppSigla: opp?.teamCode ?? null,
            oppLogo: getLogo(opp),
            isHome: Number(mine?.isHomeCompetitor) === 1,
            result: myScore > oppScore ? "W" : myScore < oppScore ? "L" : "E",
          }
        })
    }

    // Head-to-head
    const h2h = completed
      .filter((m: any) => {
        const ids = (m.competitors ?? []).map((c: any) => String(c.teamId ?? c.competitorId))
        return ids.includes(String(homeId)) && ids.includes(String(awayId))
      })
      .sort((a: any, b: any) => (b.matchTime ?? "").localeCompare(a.matchTime ?? ""))
      .map((m: any) => {
        const comps: any[] = m.competitors ?? []
        const hc = comps.find((c: any) => Number(c.isHomeCompetitor) === 1) ?? comps[0]
        const ac = comps.find((c: any) => Number(c.isHomeCompetitor) === 0) ?? comps[1]
        return {
          date: (m.matchTime ?? "").split(" ")[0] ?? null,
          homeName: hc?.competitorName ?? "", homeSigla: hc?.teamCode ?? null, homeLogo: getLogo(hc),
          homeScore: parseInt(hc?.scoreString ?? "") || null,
          awayName: ac?.competitorName ?? "", awaySigla: ac?.teamCode ?? null, awayLogo: getLogo(ac),
          awayScore: parseInt(ac?.scoreString ?? "") || null,
        }
      })

    // Top players per team
    const getTopPlayers = (tid: any, limit = 3) => {
      return statsData.players
        .filter(p => String(p.teamId) === String(tid))
        .sort((a, b) => b.ptsAvg - a.ptsAvg)
        .slice(0, limit)
        .map(p => ({
          personId: p.personId, name: p.playerName, photoUrl: p.photoUrl,
          teamLogo: p.teamLogo, games: p.games,
          ptsAvg: p.ptsAvg, rebAvg: p.rebAvg, astAvg: p.astAvg, fgPct: p.fgPct,
        }))
    }

    return NextResponse.json({
      match: {
        id: rawMatch.matchId,
        date: datePart ?? null, time: timePart,
        isoDateTime: datePart && timePart ? `${datePart}T${timePart}:00` : null,
        status: rawMatch.matchStatus ?? "SCHEDULED",
        venue: rawMatch.venue?.venueName ?? rawMatch.venueName ?? null,
        statsUrl: `https://fibalivestats.dcd.shared.geniussports.com/u/FPB/${rawMatch.matchId}/`,
      },
      home: {
        id: homeId, name: homeComp?.competitorName ?? homeComp?.teamName ?? "Local",
        sigla: homeComp?.teamCode ?? null, logo: getLogo(homeComp),
        standing: extractStanding(homeId), recentForm: getForm(homeId),
        topPlayers: getTopPlayers(homeId),
        teamStats: statsData.teams.find(t => String(t.teamId) === String(homeId)) ?? null,
      },
      away: {
        id: awayId, name: awayComp?.competitorName ?? awayComp?.teamName ?? "Visitante",
        sigla: awayComp?.teamCode ?? null, logo: getLogo(awayComp),
        standing: extractStanding(awayId), recentForm: getForm(awayId),
        topPlayers: getTopPlayers(awayId),
        teamStats: statsData.teams.find(t => String(t.teamId) === String(awayId)) ?? null,
      },
      h2h,
    }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } })
  } catch (error) {
    return handleApiError(error, { context: "website/partido-previa" })
  }
}
