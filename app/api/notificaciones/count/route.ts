import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Lightweight endpoint for notification + badge polling.
 * Returns unread count and, for admins, pending counters for sidebar badges.
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const [unreadCount, roles] = await Promise.all([
      prisma.notificacion.count({
        where: { usuarioId: user.id, leido: false },
      }),
      prisma.usuarioRol.findMany({
        where: { usuarioId: user.id },
        select: { rol: true },
      }),
    ])

    const isAdmin = roles.some((r) =>
      ["SUPER_ADMIN", "INSTRUCTOR", "VERIFICADOR"].includes(r.rol)
    )

    if (isAdmin) {
      const [pendingUsers, pendingPayments, pendingCT] = await Promise.all([
        prisma.usuario.count({ where: { estadoVerificacion: "PENDIENTE" } }),
        prisma.pago.count({ where: { estado: "PENDIENTE_REVISION" } }),
        prisma.cuerpoTecnico.count({ where: { estadoHabilitacion: "PENDIENTE" } }),
      ])
      return NextResponse.json({ unreadCount, pendingUsers, pendingPayments, pendingCT })
    }

    return NextResponse.json({ unreadCount })
  } catch {
    return NextResponse.json({ unreadCount: 0 })
  }
}
