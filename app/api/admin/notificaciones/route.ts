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

    const { titulo, mensaje, destinatarios, enviarEmail, enviarNotificacion, emailEspecifico } = await request.json()

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
    let ctUsers: { email: string; nombre: string }[] = [] // CT don't have notificaciones table yet

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
    } else if (destinatarios === "CT_TODOS") {
      const cts = await prisma.cuerpoTecnico.findMany({ select: { email: true, nombre: true } })
      ctUsers = cts
    } else if (destinatarios === "CT_HABILITADOS") {
      const cts = await prisma.cuerpoTecnico.findMany({ where: { estadoHabilitacion: "HABILITADO" }, select: { email: true, nombre: true } })
      ctUsers = cts
    } else if (destinatarios === "CT_PENDIENTES") {
      const cts = await prisma.cuerpoTecnico.findMany({ where: { estadoHabilitacion: "PENDIENTE" }, select: { email: true, nombre: true } })
      ctUsers = cts
    } else if (destinatarios === "USUARIO_ESPECIFICO" && emailEspecifico) {
      // Search in both tables
      const oficial = await prisma.usuario.findFirst({ where: { email: emailEspecifico }, select: selectFields })
      if (oficial) {
        users = [oficial]
      } else {
        const ct = await prisma.cuerpoTecnico.findFirst({ where: { email: emailEspecifico }, select: { email: true, nombre: true } })
        if (ct) ctUsers = [ct]
      }
    } else if (destinatarios.startsWith("USER_")) {
      const userId = destinatarios.replace("USER_", "")
      const user = await prisma.usuario.findUnique({ where: { id: userId }, select: selectFields })
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
            body: mensaje.replace(/\n/g, "<br>"),
            type: "info",
          })
        )
      )
      emailSent = results.filter((r) => r.status === "fulfilled" && r.value !== null).length
    }

    // Send emails to CT users
    if (shouldEmail && ctUsers.length > 0) {
      const ctResults = await Promise.allSettled(
        ctUsers.map((ct) =>
          sendEmail({
            to: ct.email,
            subject: titulo,
            nombre: ct.nombre,
            body: mensaje.replace(/\n/g, "<br>"),
            type: "info",
          })
        )
      )
      emailSent += ctResults.filter((r) => r.status === "fulfilled" && r.value !== null).length
    }

    const total = users.length + ctUsers.length

    return NextResponse.json({
      notifSent,
      emailSent,
      total,
      emailSkipped: shouldEmail ? (users.length + ctUsers.length) - emailSent : 0,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
