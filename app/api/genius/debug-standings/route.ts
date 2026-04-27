import { NextRequest, NextResponse } from "next/server"
import { requireRole, isAuthError } from "@/lib/api-auth"
import {
  computeStandingsFromMatches,
  loadLnbSchedule,
  loadLnbfSchedule,
} from "@/lib/programacion-lnb"
import { getStandings } from "@/lib/genius-sports"
import { normalizeStandings } from "@/lib/normalize-standings"

export const dynamic = "force-dynamic"

/**
 * Debug endpoint: side-by-side comparison of Genius's standings vs the
 * standings we compute locally from match data (with FibaLiveStats fallback
 * for OT-broken scores). Use to diagnose why Amambay shows 1W-2L on the
 * official tab but 2W-2L on the club page.
 *
 * GET /api/genius/debug-standings?league=lnb|lnbf  (default: lnb)
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole("SUPER_ADMIN")
  if (isAuthError(auth)) return auth

  const league = (req.nextUrl.searchParams.get("league") ?? "lnb").toLowerCase()
  const loader = league === "lnbf" ? loadLnbfSchedule : loadLnbSchedule

  try {
    const { competition, matches, teams } = await loader()
    const computed = computeStandingsFromMatches(matches, teams)

    let genius: any[] = []
    let geniusError: string | null = null
    try {
      const sRaw = await getStandings(competition.id)
      genius = normalizeStandings(sRaw).sort((a, b) => a.rank - b.rank)
    } catch (e: any) {
      geniusError = e?.message ?? String(e)
    }

    // Per-team diff (matched by teamName lowercase)
    const norm = (s: string) => s.toLowerCase().trim()
    const computedByName = new Map(computed.map((r) => [norm(r.teamName), r]))
    const geniusByName = new Map(genius.map((r) => [norm(r.teamName), r]))
    const allNames = Array.from(
      new Set<string>([...computedByName.keys(), ...geniusByName.keys()])
    )
    const diff = allNames.map((name) => {
      const c = computedByName.get(name) ?? null
      const g = geniusByName.get(name) ?? null
      const sameWL = c && g ? c.wins === g.wins && c.losses === g.losses : null
      return {
        team: c?.teamName ?? g?.teamName ?? name,
        computed: c ? { rank: c.rank, W: c.wins, L: c.losses, PJ: c.gamesPlayed, PF: c.pointsFor, PC: c.pointsAgainst, dif: c.pointDiff } : null,
        genius: g ? { rank: g.rank, W: g.wins, L: g.losses, PJ: g.gamesPlayed, PF: g.pointsFor, PC: g.pointsAgainst, dif: g.pointDiff } : null,
        sameWL,
      }
    })

    // Match-level breakdown — what each completed match contributes
    const completedMatches = matches
      .filter((m) => m.status === "COMPLETE")
      .map((m) => ({
        matchId: m.id,
        date: m.date,
        round: m.roundLabel,
        home: m.homeName,
        away: m.awayName,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        winner:
          m.homeScore != null && m.awayScore != null && m.homeScore !== m.awayScore
            ? m.homeScore > m.awayScore
              ? m.homeName
              : m.awayName
            : "TIE/UNKNOWN",
        statsUrl: m.statsUrl,
      }))

    return NextResponse.json({
      league,
      competition,
      counts: {
        teams: teams.length,
        matchesTotal: matches.length,
        matchesCompleted: completedMatches.length,
      },
      diff,
      computed,
      genius,
      geniusError,
      completedMatches,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
