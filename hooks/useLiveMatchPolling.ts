"use client"

import { useEffect, useState } from "react"

export interface LiveMatchState {
  homeScore: number | null
  awayScore: number | null
  period: number | null
  clock: string | null
}

export function periodLabel(period: number | null | undefined): string | null {
  if (period == null || !Number.isFinite(period)) return null
  if (period <= 4) return `${period}°C`
  return `${period - 4}°OT`
}

export function liveBadgeText(state: { period: number | null; clock: string | null }): string | null {
  return [periodLabel(state.period), state.clock].filter(Boolean).join(" · ") || null
}

/** Polls /api/genius/live-match/[matchId] every `intervalMs` while `enabled` is true. */
export function useLiveMatchPolling(
  matchId: string | number,
  enabled: boolean,
  initial: LiveMatchState,
  intervalMs = 30_000,
): LiveMatchState {
  const [state, setState] = useState<LiveMatchState>(initial)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function tick() {
      try {
        const res = await fetch(`/api/genius/live-match/${matchId}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setState((prev) => ({
          homeScore: data.homeScore ?? prev.homeScore,
          awayScore: data.awayScore ?? prev.awayScore,
          period: data.period ?? prev.period,
          clock: data.clock ?? prev.clock,
        }))
      } catch {
        // ignore — keep previous state
      }
    }

    tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [matchId, enabled, intervalMs])

  return state
}
