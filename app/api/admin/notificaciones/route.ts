import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createNotificacion } from "@/lib/notifications"
import { sendEmail } from "@/lib/email"
import { handleApiError } from "@/lib/api-errors"

// Envía emails en lotes de 5 con 1.2s de pausa entre lotes (límite Resend: 5/seg)
async function sendEmailsBatched(
  recipients: { email: string; nombre: string }[],
  subject: string,
  body: string
): Promise<number> {
  const BATCH_SIZE = 5
  const DELAY_MS = 1200
  let sent = 0

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map((r) =>
        sendEmail({ to: r.email, subject, nombre: r.nombre, body, type: "info" })
      )
    )
    sent += results.filter((r) => r.status === "fulfilled" && r.value !== null).length

    // Pausa entre lotes (excepto el último)
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
    }
  }

  return sent
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

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
    let ctUsers: { id: string; email: string; nombre: string }[] = []

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
      ctUsers = await prisma.cuerpoTecnico.findMany({ select: { id: true, email: true, nombre: true } })
    } else if (destinatarios === "CT_HABILITADOS") {
      ctUsers = await prisma.cuerpoTecnico.findMany({ where: { estadoHabilitacion: "HABILITADO" }, select: { id: true, email: true, nombre: true } })
    } else if (destinatarios === "CT_PENDIENTES") {
      ctUsers = await prisma.cuerpoTecnico.findMany({ where: { estadoHabilitacion: "PENDIENTE" }, select: { id: true, email: true, nombre: true } })
    } else if (destinatarios === "USUARIO_ESPECIFICO" && emailEspecifico) {
      const oficial = await prisma.usuario.findFirst({ where: { email: emailEspecifico }, select: selectFields })
      if (oficial) {
        users = [oficial]
      } else {
        const ct = await prisma.cuerpoTecnico.findFirst({ where: { email: emailEspecifico }, select: { id: true, email: true, nombre: true } })
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

    // Send internal notifications to CT
    if (shouldNotify && ctUsers.length > 0) {
      await Promise.allSettled(
        ctUsers.map((ct) =>
          prisma.notificacionCT.create({
            data: {
              ctId: ct.id,
              tipo: "MENSAJE_ADMIN",
              titulo,
              mensaje,
              enviadoPor: session.user.id,
            },
          })
        )
      )
      notifSent += ctUsers.length
    }

    // Send emails in batches to respect Resend rate limit (5/sec)
    if (shouldEmail) {
      const allRecipients = [
        ...users.map((u) => ({ email: u.email, nombre: u.nombre })),
        ...ctUsers.map((ct) => ({ email: ct.email, nombre: ct.nombre })),
      ]
      emailSent = await sendEmailsBatched(
        allRecipients,
        titulo,
        mensaje.replace(/\n/g, "<br>")
      )
    }

    const total = users.length + ctUsers.length

    return NextResponse.json({
      notifSent,
      emailSent,
      total,
      emailSkipped: shouldEmail ? (users.length + ctUsers.length) - emailSent : 0,
    })
  } catch (error) {
    return handleApiError(error, { context: "admin/notificaciones" })
  }
}
