import { NextRequest, NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const { matchId } = params
  const { searchParams } = req.nextUrl
  const homeId = searchParams.get("homeId")
  const awayId = searchParams.get("awayId")

  if (!homeId || !awayId) {
    return NextResponse.json({ error: "homeId and awayId required" }, { status: 400 })
  }

  try {
    const [homePlayers, awayPlayers, fibaData] = await Promise.all([
      geniusFetch(`/matches/${matchId}/players?teamId=${homeId}`, "long"),
      geniusFetch(`/matches/${matchId}/players?teamId=${awayId}`, "long"),
      fetch(`https://fibalivestats.dcd.shared.geniussports.com/data/${matchId}/data.json`, {
        signal: AbortSignal.timeout(5000),
      })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ])

    // Period scores
    let periods: { home: number; away: number }[] = []
    const fibaTeams: any[] = fibaData?.tm ? Object.values(fibaData.tm) : []
    const fibaHome = fibaTeams.find((t: any) => t.sno === "1")
    const fibaAway = fibaTeams.find((t: any) => t.sno === "2")

    if (fibaHome && fibaAway) {
      const numPeriods = Math.max(
        Object.keys(fibaHome?.per ?? {}).length,
        Object.keys(fibaAway?.per ?? {}).length
      )
      for (let p = 1; p <= numPeriods; p++) {
        periods.push({
          home: fibaHome?.per?.[p]?.sc ?? 0,
          away: fibaAway?.per?.[p]?.sc ?? 0,
        })
      }
    }

    // Map player from either FibaLiveStats or Genius Warehouse
    const mapPlayer = (p: any) => ({
      number: String(p.no ?? p.shirtNumber ?? p.shirt ?? "–"),
      name: `${p.fn ?? p.firstName ?? ""} ${p.ln ?? p.familyName ?? p.lastName ?? ""}`.trim(),
      min: p.sMinutes ?? "–",
      pts: p.sPoints ?? 0,
      fg2m: p.sTwoPointersMade ?? 0,
      fg2a: p.sTwoPointersAttempted ?? 0,
      fg3m: p.sThreePointersMade ?? 0,
      fg3a: p.sThreePointersAttempted ?? 0,
      ftm: p.sFreeThrowsMade ?? 0,
      fta: p.sFreeThrowsAttempted ?? 0,
      ro: p.sReboundsOffensive ?? 0,
      rd: p.sReboundsDefensive ?? 0,
      reb: p.sReboundsTotal ?? 0,
      ast: p.sAssists ?? 0,
      stl: p.sSteals ?? 0,
      blk: p.sBlocks ?? 0,
      to: p.sTurnovers ?? 0,
      pf: p.sFoulsPersonal ?? 0,
      fr: p.sFoulsOn ?? p.sFoulsReceived ?? 0,
      pm: p.sPlusMinus ?? null,
      eff: p.sEfficiency ?? 0,
      captain: !!(p.captain),
      starter: !!(p.starter ?? p.starting ?? p.isStarting ?? p.isStarter),
    })

    const sortByStarterThenPts = (a: any, b: any) => {
      if (a.starter && !b.starter) return -1
      if (!a.starter && b.starter) return 1
      return b.pts - a.pts
    }

    const hasAnyActivity = (r: any) =>
      r.pts > 0 || Number(r.min) > 0 ||
      r.reb > 0 || r.ast > 0 || r.stl > 0 || r.blk > 0 ||
      r.to > 0 || r.pf > 0 || r.fg2a > 0 || r.fg3a > 0 || r.fta > 0

    const geniusPlayers = (raw: any): any[] => {
      const arr: any[] = Array.isArray(raw) ? raw : (raw?.response?.data ?? raw?.data ?? [])
      return arr
        .filter((p: any) => p.played === 1 || Number(p.sMinutes || 0) > 0)
        .map(mapPlayer)
        .filter(hasAnyActivity)
    }

    // Merge FibaLiveStats (authoritative) + Genius (fills in any players missing from FIBA)
    const mergeTeamPlayers = (fibaTeam: any, geniusRaw: any): any[] => {
      const genius = geniusPlayers(geniusRaw)
      if (!fibaTeam?.pl) return genius.sort(sortByStarterThenPts)

      const fiba: any[] = Object.values(fibaTeam.pl).map(mapPlayer)
      const fibaNumbers = new Set(fiba.map((p: any) => p.number))
      // Include Genius players whose shirt number isn't in FibaLiveStats
      const geniusOnly = genius.filter((p: any) => !fibaNumbers.has(p.number))
      return [...fiba, ...geniusOnly].sort(sortByStarterThenPts)
    }

    // Extract team-level stats from FibaLiveStats
    const teamStats = (td: any) => {
      const tot = td?.tot ?? {}
      return {
        coach: td?.cch ?? td?.coach ?? null,
        assistantCoach: td?.ac ?? td?.assistantCoach ?? null,
        pointsFromTO: tot.sPointsFromTurnover ?? tot.sPointsTurnover ?? null,
        pointsInPaint: tot.sPointsInPaint ?? tot.sPaintPoints ?? null,
        pointsSecondChance: tot.sPointsSecondChance ?? tot.sSecondChancePoints ?? null,
        pointsFastBreak: tot.sPointsFastBreak ?? tot.sFastBreakPoints ?? null,
        benchPoints: tot.sBenchPoints ?? null,
        biggestLead: tot.sBiggestLead ?? null,
        biggestRun: tot.sBiggestRun ?? null,
      }
    }

    return NextResponse.json({
      matchId,
      periods,
      home: {
        players: mergeTeamPlayers(fibaHome, homePlayers),
        stats: teamStats(fibaHome),
      },
      away: {
        players: mergeTeamPlayers(fibaAway, awayPlayers),
        stats: teamStats(fibaAway),
      },
    })
  } catch (err) {
    console.error("[boxscore]", err)
    return NextResponse.json({ error: "Failed to fetch box score" }, { status: 500 })
  }
}
