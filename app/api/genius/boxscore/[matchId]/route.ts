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

    // Map a player object (FibaLiveStats OR Genius Warehouse) to a normalised row
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
      eff: p.sEfficiency ?? 0,
      captain: !!(p.captain),
      starter: !!(p.starter ?? p.starting ?? p.isStarting ?? p.isStarter),
    })

    const sortPlayers = (rows: any[]) =>
      rows
        .filter(r => r.pts > 0 || Number(r.min) > 0)
        .sort((a, b) => {
          if (a.starter && !b.starter) return -1
          if (!a.starter && b.starter) return 1
          return b.pts - a.pts
        })

    // Prefer FibaLiveStats players (complete data) — fall back to Genius Warehouse API
    const fibaTeams: any[] = fibaData?.tm ? Object.values(fibaData.tm) : []
    const fibaHome = fibaTeams.find((t: any) => t.sno === "1")
    const fibaAway = fibaTeams.find((t: any) => t.sno === "2")

    const fromFiba = (teamData: any): any[] | null => {
      if (!teamData?.pl) return null
      const players = Object.values(teamData.pl).map(mapPlayer)
      return players.length > 0 ? sortPlayers(players) : null
    }

    const fromGenius = (raw: any): any[] => {
      const arr: any[] = Array.isArray(raw) ? raw : (raw?.response?.data ?? raw?.data ?? [])
      return sortPlayers(arr.filter((p: any) => p.played === 1 || Number(p.sMinutes || 0) > 0).map(mapPlayer))
    }

    return NextResponse.json({
      matchId,
      periods,
      home: fromFiba(fibaHome) ?? fromGenius(homePlayers),
      away: fromFiba(fibaAway) ?? fromGenius(awayPlayers),
    })
  } catch (err) {
    console.error("[boxscore]", err)
    return NextResponse.json({ error: "Failed to fetch box score" }, { status: 500 })
  }
}
