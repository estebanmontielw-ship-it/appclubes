import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createNotificacion } from "@/lib/notifications"
import { sendEmail } from "@/lib/email"

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

    const { titulo, mensaje, destinatarios, enviarEmail, enviarNotificacion } = await request.json()

    if (!titulo || !mensaje || !destinatarios) {
      return NextResponse.json(
        { error: "Título, mensaje y destinatarios son requeridos" },
        { status: 400 }
      )
    }

    const shouldNotify = enviarNotificacion !== false
    const shouldEmail = enviarEmail === true

    // Get target users based on selection
    let users: { id: string; email: string; nombre: string }[] = []

    const selectFields = { id: true, email: true, nombre: true }

    if (destinatarios === "TODOS") {
      users = await prisma.usuario.findMany({ select: selectFields })
    } else if (["ARBITRO", "MESA", "ESTADISTICO"].includes(destinatarios)) {
      const roles = await prisma.usuarioRol.findMany({
        where: { rol: destinatarios },
        include: { usuario: { select: selectFields } },
      })
      users = roles.map((r) => r.usuario)
    } else if (destinatarios === "VERIFICADOS") {
      users = await prisma.usuario.findMany({
        where: { estadoVerificacion: "VERIFICADO" },
        select: selectFields,
      })
    } else if (destinatarios === "PENDIENTES") {
      users = await prisma.usuario.findMany({
        where: { estadoVerificacion: "PENDIENTE" },
        select: selectFields,
      })
    } else if (destinatarios.startsWith("USER_")) {
      // Single user by ID
      const userId = destinatarios.replace("USER_", "")
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: selectFields,
      })
      if (user) users = [user]
    }

    let notifSent = 0
    let emailSent = 0

    // Send notifications
    if (shouldNotify) {
      const results = await Promise.allSettled(
        users.map((user) =>
          createNotificacion({
            usuarioId: user.id,
            tipo: "MENSAJE_ADMIN",
            titulo,
            mensaje,
            enviadoPor: session.user.id,
          })
        )
      )
      notifSent = results.filter((r) => r.status === "fulfilled").length
    }

    // Send emails
    if (shouldEmail) {
      const results = await Promise.allSettled(
        users.map((user) =>
          sendEmail({
            to: user.email,
            subject: titulo,
            nombre: user.nombre,
            body: mensaje
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;")
              .replace(/\n/g, "<br>"),
            type: "info",
          })
        )
      )
      emailSent = results.filter((r) => r.status === "fulfilled").length
    }

    return NextResponse.json({
      notifSent,
      emailSent,
      total: users.length,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
