import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const [ct, unreadNotifications] = await Promise.all([
      prisma.cuerpoTecnico.findUnique({ where: { id: user.id } }),
      prisma.notificacionCT.count({ where: { ctId: user.id, leido: false } }),
    ])

    if (!ct) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    return NextResponse.json({ ct, unreadNotifications })
  } catch (error) {
    return handleApiError(error, { context: "ct/me" })
  }
}
