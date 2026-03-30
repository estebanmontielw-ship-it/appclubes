import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createNotificacion } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })

    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { titulo, mensaje, destinatarios } = await request.json()

    if (!titulo || !mensaje || !destinatarios) {
      return NextResponse.json(
        { error: "Título, mensaje y destinatarios son requeridos" },
        { status: 400 }
      )
    }

    // Get target users based on selection
    let userIds: string[] = []

    if (destinatarios === "TODOS") {
      const users = await prisma.usuario.findMany({ select: { id: true } })
      userIds = users.map((u) => u.id)
    } else if (
      ["ARBITRO", "MESA", "ESTADISTICO"].includes(destinatarios)
    ) {
      const roles = await prisma.usuarioRol.findMany({
        where: { rol: destinatarios },
        select: { usuarioId: true },
      })
      userIds = roles.map((r) => r.usuarioId)
    } else if (destinatarios === "VERIFICADOS") {
      const users = await prisma.usuario.findMany({
        where: { estadoVerificacion: "VERIFICADO" },
        select: { id: true },
      })
      userIds = users.map((u) => u.id)
    }

    // Create notifications for all users
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        createNotificacion({
          usuarioId: userId,
          tipo: "MENSAJE_ADMIN",
          titulo,
          mensaje,
          enviadoPor: session.user.id,
        })
      )
    )

    const sent = results.filter((r) => r.status === "fulfilled").length

    return NextResponse.json({ sent, total: userIds.length })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
