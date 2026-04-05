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
