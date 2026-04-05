import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // Rate limit: 10 registros de token por minuto
  const rateLimitResponse = rateLimit(request, 10, 60_000, "push-register")
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 400 })

    // Try to get user
    let userId: string | null = null
    let userType = "public"

    try {
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        userId = user.id
        // Check if oficial or CT
        const oficial = await prisma.usuario.findUnique({ where: { id: user.id }, select: { id: true } })
        if (oficial) {
          userType = "oficial"
        } else {
          const ct = await prisma.cuerpoTecnico.findUnique({ where: { id: user.id }, select: { id: true } })
          if (ct) userType = "ct"
        }
      }
    } catch {}

    // Upsert token
    await prisma.pushToken.upsert({
      where: { token },
      update: { userId, userType, updatedAt: new Date() },
      create: { token, userId, userType, updatedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
