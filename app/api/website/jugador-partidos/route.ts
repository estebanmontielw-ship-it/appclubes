import { NextResponse } from "next/server"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { geniusFetch } from "@/lib/genius-sports"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const personIdStr = searchParams.get("personId")
    if (!personIdStr) return NextResponse.json({ error: "personId requerido" }, { status: 400 })
    const personId = parseInt(personIdStr, 10)
    if (isNaN(personId)) return NextResponse.json({ error: "personId inválido" }, { status: 400 })

    const { id: competitionId } = await resolveLnbCompetitionIdPublic()
    if (!competitionId) return NextResponse.json({ error: "Sin competencia activa" }, { status: 404 })

    const matchesRaw = await geniusFetch(`/competitions/${competitionId}/matches?limit=100`, "medium")
    const allMatches: any[] = matchesRaw?.response?.data ?? matchesRaw?.data ?? []
    const completed = allMatches.filter((m: any) => m.matchStatus === "COMPLETE")

    // Fetch player stats for each completed match (only matches where this player appeared)
    const gameLog: any[] = []

    await Promise.all(
      completed.map(async (match: any) => {
        try {
          const competitors: any[] = match.competitors ?? []
          // Fetch for all teams
          const teamIds = competitors.map((c: any) => c.teamId ?? c.competitorId).filter(Boolean)
          const teamResults = await Promise.all(
            teamIds.map((tid: any) =>
              geniusFetch(`/matches/${match.matchId}/players?teamId=${tid}`, "long").catch(() => null)
            )
          )

          for (let i = 0; i < teamResults.length; i++) {
            const result = teamResults[i]
            if (!result) continue
            const players: any[] = result?.response?.data ?? result?.data ?? []
            // Only use period=0 (totals row), not per-quarter rows
            const player = players.find((p: any) =>
              (p.personId === personId || String(p.personId) === String(personId)) &&
              (p.periodNumber === 0 || p.periodNumber == null)
            )
            if (!player) continue

            const teamId = teamIds[i]
            const myComp = competitors.find((c: any) => String(c.teamId ?? c.competitorId) === String(teamId))
            const oppComp = competitors.find((c: any) => String(c.teamId ?? c.competitorId) !== String(teamId))
            const isHome = Number(myComp?.isHomeCompetitor) === 1

            const myScore = parseInt(myComp?.scoreString ?? "") || null
            const oppScore = parseInt(oppComp?.scoreString ?? "") || null
            const result_ = myScore != null && oppScore != null
              ? (myScore > oppScore ? "W" : myScore < oppScore ? "L" : "E")
              : null

            const twoM = player.sTwoPointersMade ?? 0
            const twoA = player.sTwoPointersAttempted ?? 0
            const threeM = player.sThreePointersMade ?? 0
            const threeA = player.sThreePointersAttempted ?? 0
            const ftM = player.sFreeThrowsMade ?? 0
            const ftA = player.sFreeThrowsAttempted ?? 0
            const lcM = twoM + threeM
            const lcA = twoA + threeA

            gameLog.push({
              matchId: match.matchId,
              date: (match.matchTime ?? "").split(" ")[0] ?? null,
              isHome,
              oppName: oppComp?.competitorName ?? oppComp?.teamName ?? "?",
              oppSigla: oppComp?.teamCode ?? null,
              myScore,
              oppScore,
              result: result_,
              pos: player.positionName ?? player.position ?? null,
              min: player.sMinutes ?? null,
              pts: player.sPoints ?? 0,
              lcM, lcA,
              lcPct: lcA > 0 ? Math.round((lcM / lcA) * 1000) / 10 : null,
              twoM, twoA,
              twoPct: twoA > 0 ? Math.round((twoM / twoA) * 1000) / 10 : null,
              threeM, threeA,
              threePct: threeA > 0 ? Math.round((threeM / threeA) * 1000) / 10 : null,
              ftM, ftA,
              ftPct: ftA > 0 ? Math.round((ftM / ftA) * 1000) / 10 : null,
              rebOff: player.sReboundsOffensive ?? 0,
              rebDef: player.sReboundsDefensive ?? 0,
              reb: player.sReboundsTotal ?? 0,
              ast: player.sAssists ?? 0,
              eff: player.sEfficiency ?? null,
              stl: player.sSteals ?? 0,
              blk: player.sBlocks ?? 0,
              to: player.sTurnovers ?? 0,
              fp: player.sFoulsPersonal ?? 0,
              fr: player.sFoulsOn ?? 0,
              plusMinus: player.sPlusMinus ?? null,
            })
            break
          }
        } catch {
          // skip this match on error
        }
      })
    )

    gameLog.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))

    return NextResponse.json({ games: gameLog }, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
    })
  } catch (error) {
    return handleApiError(error, { context: "website/jugador-partidos" })
  }
}
