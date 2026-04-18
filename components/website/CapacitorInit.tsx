"use client"

/**
 * Runs once when the app starts in Capacitor (iOS/Android).
 * Handles: push token registration, status bar, back button, splash hide.
 * In browser, this is a no-op.
 */
import { useEffect } from "react"
import { isNative, registerNativePush, savePushToken } from "@/lib/native-push"

export default function CapacitorInit() {
  useEffect(() => {
    if (!isNative()) return

    async function init() {
      try {
        // Configure status bar
        const { StatusBar, Style } = await import("@capacitor/status-bar")
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: "#0a1628" })
      } catch {}

      try {
        // Hide splash after page load
        const { SplashScreen } = await import("@capacitor/splash-screen")
        await SplashScreen.hide({ fadeOutDuration: 300 })
      } catch {}

      try {
        // Handle Android back button — go back in history, or minimize app at root
        const { App } = await import("@capacitor/app")
        App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back()
          } else {
            App.minimizeApp()
          }
        })
      } catch {}

      // Register for push notifications silently if already granted
      try {
        if (typeof window !== "undefined" && "Notification" in window) {
          if ((window as any).Capacitor?.isNative) {
            const { PushNotifications } = await import("@capacitor/push-notifications")
            const perm = await PushNotifications.checkPermissions()
            if (perm.receive === "granted") {
              const token = await registerNativePush()
              if (token) await savePushToken(token)
            }
          }
        }
      } catch {}
    }

    init()
  }, [])

  return null
}
