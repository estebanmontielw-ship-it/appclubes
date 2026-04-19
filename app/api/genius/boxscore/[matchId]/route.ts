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
    // Fetch players for both teams + match info in parallel
    const [homePlayers, awayPlayers, fibaData] = await Promise.all([
      geniusFetch(`/matches/${matchId}/players?teamId=${homeId}`, "long"),
      geniusFetch(`/matches/${matchId}/players?teamId=${awayId}`, "long"),
      // FibaLiveStats data.json for period scores
      fetch(`https://fibalivestats.dcd.shared.geniussports.com/data/${matchId}/data.json`, {
        signal: AbortSignal.timeout(5000),
      })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ])

    // Extract period scores from FibaLiveStats
    let periods: { home: number; away: number }[] = []
    if (fibaData?.tm) {
      const teamKeys = Object.keys(fibaData.tm)
      if (teamKeys.length >= 2) {
        const t1 = fibaData.tm[teamKeys[0]]
        const t2 = fibaData.tm[teamKeys[1]]
        // Determine which is home/away from sno (team number)
        const home = t1?.sno === "1" ? t1 : t2
        const away = t1?.sno === "1" ? t2 : t1
        const numPeriods = Math.max(
          Object.keys(home?.per ?? {}).length,
          Object.keys(away?.per ?? {}).length
        )
        for (let p = 1; p <= numPeriods; p++) {
          periods.push({
            home: home?.per?.[p]?.sc ?? 0,
            away: away?.per?.[p]?.sc ?? 0,
          })
        }
      }
    }

    const normalize = (raw: any, _teamId: string) => {
      const players: any[] = Array.isArray(raw) ? raw : (raw?.response?.data ?? raw?.data ?? [])
      return players
        .filter((p: any) => p.played === 1 || p.sMinutes)
        .map((p: any) => ({
          number: p.shirtNumber ?? p.shirt ?? "–",
          name: `${p.firstName ?? ""} ${p.familyName ?? p.lastName ?? ""}`.trim(),
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
          eff: p.sEfficiency ?? 0,
          captain: !!p.captain,
          starter: !!p.starting,
        }))
        .sort((a: any, b: any) => {
          if (a.starter && !b.starter) return -1
          if (!a.starter && b.starter) return 1
          return (b.pts as number) - (a.pts as number)
        })
    }

    return NextResponse.json({
      matchId,
      periods,
      home: normalize(homePlayers, homeId),
      away: normalize(awayPlayers, awayId),
    })
  } catch (err) {
    console.error("[boxscore]", err)
    return NextResponse.json({ error: "Failed to fetch box score" }, { status: 500 })
  }
}
