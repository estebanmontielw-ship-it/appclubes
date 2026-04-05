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
  /** Force an immediate refresh */
  refresh: () => void
}

/**
 * Hook para polling inteligente de notificaciones.
 * - Hace polling cada `interval` ms cuando el tab está visible.
 * - Pausa automáticamente cuando el tab está oculto.
 * - Expone `refresh()` para actualización inmediata tras acciones del usuario.
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { interval = 30_000, enabled = true } = options
  const [unreadCount, setUnreadCount] = useState(0)
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

  return { unreadCount, refresh }
}
