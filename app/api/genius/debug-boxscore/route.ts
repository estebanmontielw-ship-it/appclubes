import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const API_BASE = "https://api.wh.geniussports.com/v1/basketball"
const API_KEY = process.env.GENIUS_SPORTS_API_KEY || ""

async function freshFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-api-key": API_KEY, "Accept": "application/json" },
    cache: "no-store",
  })
  if (!res.ok) return { error: `HTTP ${res.status}` }
  return res.json()
}

/**
 * Debug endpoint: shows raw player data from both FibaLiveStats and Genius
 * for a given match. Use to diagnose missing players in boxscore.
 *
 * GET /api/genius/debug-boxscore?matchId=X&homeId=Y&awayId=Z
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const matchId = searchParams.get("matchId")
  const homeId = searchParams.get("homeId")
  const awayId = searchParams.get("awayId")

  if (!matchId || !homeId || !awayId) {
    return NextResponse.json({ error: "matchId, homeId and awayId required" }, { status: 400 })
  }

  const [homePlayers, awayPlayers, fibaData] = await Promise.all([
    freshFetch(`/matches/${matchId}/teams/${homeId}/players?limit=100`).catch((e: any) => ({ error: String(e) })),
    freshFetch(`/matches/${matchId}/teams/${awayId}/players?limit=100`).catch((e: any) => ({ error: String(e) })),
    fetch(`https://fibalivestats.dcd.shared.geniussports.com/data/${matchId}/data.json`, {
      signal: AbortSignal.timeout(8000),
    })
      .then(r => r.ok ? r.json() : { error: `HTTP ${r.status}` })
      .catch((e: any) => ({ error: String(e) })),
  ])

  const fibaTeams: any[] = fibaData?.tm ? Object.values(fibaData.tm) : []
  const fibaHome = fibaTeams.find((t: any) => t.sno === "1")
  const fibaAway = fibaTeams.find((t: any) => t.sno === "2")

  const summarizeFibaPlayers = (team: any) => {
    if (!team?.pl) return null
    return Object.values(team.pl).map((p: any) => ({
      no: p.no,
      name: `${p.fn ?? ""} ${p.ln ?? ""}`.trim(),
      sMinutes: p.sMinutes,
      sPoints: p.sPoints,
      starter: p.starter,
    }))
  }

  const summarizeGeniusPlayers = (raw: any) => {
    const arr: any[] = Array.isArray(raw) ? raw : (raw?.response?.data ?? raw?.data ?? [])
    return arr.map((p: any) => ({
      shirtNumber: p.shirtNumber ?? p.shirt ?? p.no,
      name: `${p.firstName ?? p.fn ?? ""} ${p.familyName ?? p.lastName ?? p.ln ?? ""}`.trim(),
      played: p.played,
      sMinutes: p.sMinutes,
      sPoints: p.sPoints,
    }))
  }

  return NextResponse.json({
    matchId,
    fiba: {
      available: !!fibaHome || !!fibaAway,
      fibaError: fibaData?.error ?? null,
      home: {
        teamName: fibaHome?.tn ?? null,
        totalScore: fibaHome?.tot?.sPoints ?? null,
        playerCount: fibaHome?.pl ? Object.keys(fibaHome.pl).length : 0,
        players: summarizeFibaPlayers(fibaHome),
      },
      away: {
        teamName: fibaAway?.tn ?? null,
        totalScore: fibaAway?.tot?.sPoints ?? null,
        playerCount: fibaAway?.pl ? Object.keys(fibaAway.pl).length : 0,
        players: summarizeFibaPlayers(fibaAway),
      },
    },
    genius: {
      home: {
        playerCount: (() => {
          const arr: any[] = Array.isArray(homePlayers) ? homePlayers : (homePlayers?.response?.data ?? homePlayers?.data ?? [])
          return arr.length
        })(),
        playedCount: (() => {
          const arr: any[] = Array.isArray(homePlayers) ? homePlayers : (homePlayers?.response?.data ?? homePlayers?.data ?? [])
          return arr.filter((p: any) => p.played === 1 || Number(p.sMinutes || 0) > 0).length
        })(),
        players: summarizeGeniusPlayers(homePlayers),
      },
      away: {
        playerCount: (() => {
          const arr: any[] = Array.isArray(awayPlayers) ? awayPlayers : (awayPlayers?.response?.data ?? awayPlayers?.data ?? [])
          return arr.length
        })(),
        playedCount: (() => {
          const arr: any[] = Array.isArray(awayPlayers) ? awayPlayers : (awayPlayers?.response?.data ?? awayPlayers?.data ?? [])
          return arr.filter((p: any) => p.played === 1 || Number(p.sMinutes || 0) > 0).length
        })(),
        players: summarizeGeniusPlayers(awayPlayers),
      },
    },
  })
}
