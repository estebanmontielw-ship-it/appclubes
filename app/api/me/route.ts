import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      include: { roles: true },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const unreadNotifications = await prisma.notificacion.count({
      where: { usuarioId: usuario.id, leido: false },
    })

    return NextResponse.json({ usuario, unreadNotifications })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
