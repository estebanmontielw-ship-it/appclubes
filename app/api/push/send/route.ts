import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import admin from "firebase-admin"
import { rateLimit } from "@/lib/rate-limit"

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } catch (err) {
    console.error("Firebase Admin init error:", err)
  }
}

export async function POST(request: Request) {
  // Rate limit: 5 envíos masivos por minuto
  const rateLimitResponse = rateLimit(request, 5, 60_000, "push-send")
  if (rateLimitResponse) return rateLimitResponse

  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { titulo, mensaje, destinatarios } = await request.json()
    if (!titulo || !mensaje) return NextResponse.json({ error: "Título y mensaje requeridos" }, { status: 400 })

    // Get tokens based on destinatarios
    let where: any = {}
    if (destinatarios === "oficiales") {
      where = { userType: "oficial" }
    } else if (destinatarios === "ct") {
      where = { userType: "ct" }
    }
    // Default: all tokens

    const tokens = await prisma.pushToken.findMany({
      where,
      select: { token: true },
    })

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0, total: 0 })
    }

    const tokenList = tokens.map(t => t.token)

    // Send in batches of 500
    let sent = 0
    let failed = 0
    const failedTokens: string[] = []

    for (let i = 0; i < tokenList.length; i += 500) {
      const batch = tokenList.slice(i, i + 500)

      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title: titulo, body: mensaje },
          webpush: {
            notification: {
              icon: "/favicon-cpb.png",
              badge: "/favicon-cpb.png",
            },
            fcmOptions: {
              link: "https://cpb.com.py",
            },
          },
        })

        sent += response.successCount
        failed += response.failureCount

        // Collect failed tokens to remove
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === "messaging/registration-token-not-registered") {
            failedTokens.push(batch[idx])
          }
        })
      } catch (err) {
        console.error("FCM batch error:", err)
        failed += batch.length
      }
    }

    // Remove invalid tokens
    if (failedTokens.length > 0) {
      await prisma.pushToken.deleteMany({
        where: { token: { in: failedTokens } },
      })
    }

    return NextResponse.json({ sent, failed, total: tokenList.length, cleaned: failedTokens.length })
  } catch (err) {
    console.error("Push send error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
