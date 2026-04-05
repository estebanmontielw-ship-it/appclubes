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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { roles: true },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const unreadNotifications = await prisma.notificacion.count({
      where: { usuarioId: usuario.id, leido: false },
    })

    // If admin, count pending users and payments
    const isAdmin = usuario.roles.some((r) => ["SUPER_ADMIN", "INSTRUCTOR", "VERIFICADOR"].includes(r.rol))
    let pendingUsers = 0
    let pendingPayments = 0
    let pendingCT = 0
    if (isAdmin) {
      ;[pendingUsers, pendingPayments, pendingCT] = await Promise.all([
        prisma.usuario.count({ where: { estadoVerificacion: "PENDIENTE" } }),
        prisma.pago.count({ where: { estado: "PENDIENTE_REVISION" } }),
        prisma.cuerpoTecnico.count({ where: { estadoHabilitacion: "PENDIENTE" } }),
      ])
    }

    return NextResponse.json({ usuario, unreadNotifications, pendingUsers, pendingPayments, pendingCT })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/me" })
  }
}
