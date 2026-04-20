/**
 * Unified push notification registration.
 * - In Capacitor (iOS/Android): uses @capacitor/push-notifications for APNs/FCM
 * - In browser: uses Firebase web SDK (existing flow)
 *
 * Returns the FCM token string, or null if unavailable/denied.
 */

import { isNative } from "@/lib/capacitor"
export { isNative }

export async function registerNativePush(): Promise<string | null> {
  if (!isNative()) return null

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications")

    // Check current permission
    let permStatus = await PushNotifications.checkPermissions()

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions()
    }

    if (permStatus.receive !== "granted") return null

    // Remove any previously registered listeners to prevent duplicates on re-registration
    await PushNotifications.removeAllListeners()

    // Register and wait for token
    return new Promise((resolve) => {
      let resolved = false
      const timeout = setTimeout(() => { if (!resolved) { resolved = true; resolve(null) } }, 10000)

      PushNotifications.addListener("registration", (token) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve(token.value)
        }
      })

      PushNotifications.addListener("registrationError", () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve(null)
        }
      })

      PushNotifications.register()
    })
  } catch {
    return null
  }
}

export async function requestPushPermission(): Promise<string | null> {
  if (isNative()) {
    return registerNativePush()
  }
  // Browser fallback — uses existing Firebase web SDK
  const { requestNotificationPermission } = await import("@/lib/firebase")
  return requestNotificationPermission()
}

export async function savePushToken(token: string): Promise<void> {
  await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
}
