import admin from "firebase-admin"
import prisma from "@/lib/prisma"

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } catch {}
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"

export async function sendPublicPush(titulo: string, mensaje: string, url?: string) {
  try {
    const tokens = await prisma.pushToken.findMany({ select: { token: true } })
    if (tokens.length === 0) return

    const tokenList = tokens.map(t => t.token)
    const failedTokens: string[] = []

    for (let i = 0; i < tokenList.length; i += 500) {
      const batch = tokenList.slice(i, i + 500)
      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title: titulo, body: mensaje },
          webpush: {
            notification: {
              icon: `${BASE_URL}/favicon-cpb.png`,
              badge: `${BASE_URL}/favicon-cpb.png`,
            },
            fcmOptions: { link: url || BASE_URL },
          },
        })
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === "messaging/registration-token-not-registered") {
            failedTokens.push(batch[idx])
          }
        })
      } catch (err) {
        console.error("FCM public batch error:", err)
      }
    }

    if (failedTokens.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: failedTokens } } })
    }
  } catch (err) {
    console.error("Public push error:", err)
  }
}

export async function sendAdminPush(titulo: string, mensaje: string) {
  try {
    // Get all admin push tokens
    const adminUsers = await prisma.usuarioRol.findMany({
      where: { rol: "SUPER_ADMIN" },
      select: { usuarioId: true },
    })
    const adminIds = adminUsers.map(u => u.usuarioId)

    if (adminIds.length === 0) return

    const tokens = await prisma.pushToken.findMany({
      where: { userId: { in: adminIds } },
      select: { token: true },
    })

    if (tokens.length === 0) return

    const tokenList = tokens.map(t => t.token)

    await admin.messaging().sendEachForMulticast({
      tokens: tokenList,
      notification: { title: titulo, body: mensaje },
      webpush: {
        notification: {
          icon: "/favicon-cpb.png",
          badge: "/favicon-cpb.png",
        },
        fcmOptions: {
          link: "https://cpb.com.py/oficiales/admin",
        },
      },
    })
  } catch (err) {
    console.error("Admin push error:", err)
  }
}
