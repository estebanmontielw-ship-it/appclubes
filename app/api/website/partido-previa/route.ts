import { NextResponse } from "next/server"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { geniusFetch, getStandings, getAllPlayerStats, getCompetitions } from "@/lib/genius-sports"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")
    if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 })

    const { id: competitionId } = await resolveLnbCompetitionIdPublic()
    if (!competitionId) return NextResponse.json({ error: "Sin competencia activa" }, { status: 404 })

    const [matchesRaw, standingsRaw, statsData, allCompsRaw] = await Promise.all([
      geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "medium"),
      getStandings(competitionId).catch(() => null),
      getAllPlayerStats(competitionId).catch(() => ({ players: [], teams: [] })),
      getCompetitions().catch(() => null),
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

    // Current competition year
    const allCompsList: any[] = allCompsRaw?.response?.data ?? []
    const currentComp = allCompsList.find((c: any) => String(c.competitionId) === String(competitionId))
    const currentYear: number = currentComp?.year ?? new Date().getFullYear()

    const mapH2HEntry = (m: any, season: number | null) => {
      const comps: any[] = m.competitors ?? []
      const hc = comps.find((c: any) => Number(c.isHomeCompetitor) === 1) ?? comps[0]
      const ac = comps.find((c: any) => Number(c.isHomeCompetitor) === 0) ?? comps[1]
      return {
        date: (m.matchTime ?? "").split(" ")[0] ?? null,
        season,
        homeName: hc?.competitorName ?? "", homeSigla: hc?.teamCode ?? null, homeLogo: getLogo(hc),
        homeScore: parseInt(hc?.scoreString ?? "") || null,
        awayName: ac?.competitorName ?? "", awaySigla: ac?.teamCode ?? null, awayLogo: getLogo(ac),
        awayScore: parseInt(ac?.scoreString ?? "") || null,
      }
    }

    // Head-to-head current season
    const h2hCurrent = completed
      .filter((m: any) => {
        const ids = (m.competitors ?? []).map((c: any) => String(c.teamId ?? c.competitorId))
        return ids.includes(String(homeId)) && ids.includes(String(awayId))
      })
      .map((m: any) => mapH2HEntry(m, currentYear))

    // Historical H2H from past LNB (primera) seasons
    const pastLnbComps = allCompsList
      .filter((c: any) => {
        const name = String(c.competitionName ?? "").toUpperCase()
        const isLnb = name.includes("LNB") || (name.includes("LIGA") && name.includes("NACIONAL"))
        const isInferior = ["FEM", "MUJER", "WOMEN", "DAMAS", "U22", "U19", "U17", "U15", "U13"]
          .some(t => name.includes(t))
        return isLnb && !isInferior && String(c.competitionId) !== String(competitionId)
      })
      .sort((a: any, b: any) => (b.year ?? 0) - (a.year ?? 0))
      .slice(0, 4)

    const historyEntries: any[] = []
    await Promise.all(pastLnbComps.map(async (comp: any) => {
      try {
        const raw = await geniusFetch(`/competitions/${comp.competitionId}/matches?limit=100`, "long")
        const pastMatches: any[] = raw?.response?.data ?? raw?.data ?? []
        pastMatches
          .filter((m: any) => {
            if (m.matchStatus !== "COMPLETE") return false
            const ids = (m.competitors ?? []).map((c: any) => String(c.teamId ?? c.competitorId))
            return ids.includes(String(homeId)) && ids.includes(String(awayId))
          })
          .forEach((m: any) => historyEntries.push(mapH2HEntry(m, comp.year ?? null)))
      } catch { /* skip season on error */ }
    }))

    const h2h = [...h2hCurrent, ...historyEntries]
      .sort((a: any, b: any) => (b.date ?? "").localeCompare(a.date ?? ""))

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
