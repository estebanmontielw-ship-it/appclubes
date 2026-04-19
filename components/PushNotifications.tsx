"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"

export default function PushNotifications() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    // Skip web prompt on native Capacitor — CapacitorInit handles push there
    if (typeof window === "undefined") return
    if ((window as any).Capacitor?.isNative) return
    if (!("Notification" in window)) return

    // Skip banner if already installed as PWA — silently register if already granted
    const isPWA = window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as any).standalone
    if (isPWA) {
      if (Notification.permission === "granted") registerPush()
      return
    }

    if (Notification.permission === "granted") {
      registerPush()
      return
    }
    if (Notification.permission === "denied") return

    const asked = localStorage.getItem("cpb-push-asked")
    if (asked) {
      const askedAt = parseInt(asked)
      if (Date.now() - askedAt < 7 * 24 * 60 * 60 * 1000) return
    }

    setTimeout(() => setShowPrompt(true), 10000)
  }, [])

  async function registerPush() {
    setRegistering(true)
    try {
      // Register Firebase SW
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js")
        } catch (swErr) {
          console.warn("Firebase SW registration failed:", swErr)
        }
      }

      let token: string | null = null
      try {
        const { requestNotificationPermission } = await import("@/lib/firebase")
        token = await requestNotificationPermission()
      } catch (fcmErr) {
        console.warn("FCM token error:", fcmErr)
      }

      // Only save real FCM tokens — fake/null tokens can't receive messages
      if (token) {
        await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
      }
    } catch (err) {
      console.error("Push registration error:", err)
    } finally {
      setRegistering(false)
      setShowPrompt(false)
      localStorage.setItem("cpb-push-asked", Date.now().toString())
    }
  }

  function dismiss() {
    setShowPrompt(false)
    localStorage.setItem("cpb-push-asked", Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm animate-slide-in-right">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Activar notificaciones</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Recibí avisos de la CPB directamente en tu celular
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={registerPush}
                disabled={registering}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {registering ? "Activando..." : "Activar"}
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
