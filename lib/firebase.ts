import { initializeApp, getApps } from "firebase/app"
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const supported = await isSupported()
    if (!supported) return null

    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null

    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })

    return token
  } catch (err) {
    console.error("Error getting push token:", err)
    return null
  }
}

export function onPushMessage(callback: (payload: any) => void) {
  try {
    const messaging = getMessaging(app)
    return onMessage(messaging, callback)
  } catch {
    return () => {}
  }
}
