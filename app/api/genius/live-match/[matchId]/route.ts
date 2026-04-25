import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface LiveMatchState {
  homeScore: number | null
  awayScore: number | null
  period: number | null
  clock: string | null
  live: boolean
}

function normalizeClock(raw: string): string | null {
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!m) return null
  return `${m[1].padStart(2, "0")}:${m[2]}`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params

  const empty: LiveMatchState = {
    homeScore: null,
    awayScore: null,
    period: null,
    clock: null,
    live: false,
  }

  try {
    const url = `https://fibalivestats.dcd.shared.geniussports.com/data/${matchId}/data.json`
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return NextResponse.json(empty)
    const data = await res.json()

    const teams = data?.tm
    const t1 = teams?.["1"]
    const t2 = teams?.["2"]
    if (t1 == null || t2 == null) return NextResponse.json(empty)

    const s1 = parseInt(String(t1.score ?? t1.pts ?? ""), 10)
    const s2 = parseInt(String(t2.score ?? t2.pts ?? ""), 10)

    const periodRaw = data?.period ?? data?.periodNumber ?? data?.actual?.period ?? null
    const period = periodRaw != null ? Number(periodRaw) : null
    const clockRaw = data?.clock ?? data?.gameClock ?? data?.actual?.clock ?? null
    const clock = typeof clockRaw === "string" ? normalizeClock(clockRaw) : null

    return NextResponse.json({
      homeScore: Number.isFinite(s1) ? s1 : null,
      awayScore: Number.isFinite(s2) ? s2 : null,
      period: Number.isFinite(period) ? (period as number) : null,
      clock,
      live: true,
    })
  } catch {
    return NextResponse.json(empty)
  }
}
