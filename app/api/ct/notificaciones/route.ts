import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const soloNoLeidas = searchParams.get("unread") === "true"

    const where: Record<string, unknown> = { ctId: user.id }
    if (soloNoLeidas) where.leido = false

    const [notificaciones, totalNoLeidas] = await Promise.all([
      prisma.notificacionCT.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notificacionCT.count({ where: { ctId: user.id, leido: false } }),
    ])

    return NextResponse.json({ notificaciones, totalNoLeidas })
  } catch (error) {
    return handleApiError(error, { context: "ct/notificaciones" })
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { id, marcarTodas } = await request.json()

    if (marcarTodas) {
      await prisma.notificacionCT.updateMany({
        where: { ctId: user.id, leido: false },
        data: { leido: true, leidoEn: new Date() },
      })
    } else if (id) {
      await prisma.notificacionCT.updateMany({
        where: { id, ctId: user.id },
        data: { leido: true, leidoEn: new Date() },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, { context: "ct/notificaciones" })
  }
}
