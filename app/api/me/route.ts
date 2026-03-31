import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

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

    // If admin, count pending users
    const isAdmin = usuario.roles.some((r) => r.rol === "SUPER_ADMIN" || r.rol === "INSTRUCTOR")
    let pendingUsers = 0
    if (isAdmin) {
      pendingUsers = await prisma.usuario.count({
        where: { estadoVerificacion: "PENDIENTE" },
      })
    }

    return NextResponse.json({ usuario, unreadNotifications, pendingUsers })
  } catch (error) {
    console.error("Error in /api/me:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
