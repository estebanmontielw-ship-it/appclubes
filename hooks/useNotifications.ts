"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseNotificationsOptions {
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  interval?: number
  /** Whether polling is enabled (default: true) */
  enabled?: boolean
}

interface UseNotificationsReturn {
  unreadCount: number
  pendingUsers: number
  pendingPayments: number
  pendingCT: number
  /** Force an immediate refresh */
  refresh: () => void
}

/**
 * Hook para polling inteligente de notificaciones y badges.
 * - Hace polling cada `interval` ms cuando el tab está visible.
 * - Pausa automáticamente cuando el tab está oculto.
 * - Expone `refresh()` para actualización inmediata tras acciones del usuario.
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { interval = 30_000, enabled = true } = options
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingUsers, setPendingUsers] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)
  const [pendingCT, setPendingCT] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const fetchCount = useCallback(async () => {
    if (!enabledRef.current) return
    try {
      const res = await fetch("/api/notificaciones/count")
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount ?? 0)
        if (data.pendingUsers !== undefined) setPendingUsers(data.pendingUsers)
        if (data.pendingPayments !== undefined) setPendingPayments(data.pendingPayments)
        if (data.pendingCT !== undefined) setPendingCT(data.pendingCT)
      }
    } catch {
      // Network error — silently skip this cycle
    }
  }, [])

  // Initial fetch + start polling
  useEffect(() => {
    if (!enabled) return

    fetchCount()

    function startPolling() {
      stopPolling()
      timerRef.current = setInterval(fetchCount, interval)
    }

    function stopPolling() {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    // Visibility change handler — pause when tab hidden
    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling()
      } else {
        // Fetch immediately when tab regains focus, then resume polling
        fetchCount()
        startPolling()
      }
    }

    startPolling()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled, interval, fetchCount])

  const refresh = useCallback(() => {
    fetchCount()
  }, [fetchCount])

  return { unreadCount, pendingUsers, pendingPayments, pendingCT, refresh }
}
