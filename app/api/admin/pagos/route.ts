import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { notifPagoConfirmado, notifPagoRechazado } from "@/lib/notifications"
import { emailPagoConfirmado, emailPagoRechazado } from "@/lib/email"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)))
    const skip = (page - 1) * limit

    const where = estado ? { estado: estado as any } : {}

    const [pagos, total] = await Promise.all([
      prisma.pago.findMany({
        where,
        include: {
          inscripcion: {
            include: {
              usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
              curso: { select: { id: true, nombre: true, precio: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.pago.count({ where }),
    ])

    return NextResponse.json({ pagos, total, page, limit })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { pagoId, accion, motivoRechazo, notasAdmin } = await request.json()

    if (!pagoId || !["confirmar", "rechazar"].includes(accion)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        inscripcion: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
            curso: { select: { nombre: true } },
          },
        },
      },
    })

    if (!pago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    if (accion === "confirmar") {
      await prisma.$transaction([
        prisma.pago.update({
          where: { id: pagoId },
          data: {
            estado: "CONFIRMADO",
            revisadoPor: session.user.id,
            revisadoEn: new Date(),
            notasAdmin: notasAdmin || null,
          },
        }),
        prisma.inscripcion.update({
          where: { id: pago.inscripcionId },
          data: { estado: "ACTIVO" },
        }),
      ])

      const usuario = pago.inscripcion.usuario
      const cursoNombre = pago.inscripcion.curso.nombre
      await Promise.all([
        notifPagoConfirmado(usuario.id, cursoNombre),
        emailPagoConfirmado(usuario.email, usuario.nombre, cursoNombre),
      ])
    } else {
      if (!motivoRechazo) {
        return NextResponse.json({ error: "Motivo requerido" }, { status: 400 })
      }

      await prisma.pago.update({
        where: { id: pagoId },
        data: {
          estado: "RECHAZADO",
          revisadoPor: session.user.id,
          revisadoEn: new Date(),
          motivoRechazo,
          notasAdmin: notasAdmin || null,
        },
      })

      const usuario = pago.inscripcion.usuario
      const cursoNombre = pago.inscripcion.curso.nombre
      await Promise.all([
        notifPagoRechazado(usuario.id, cursoNombre, motivoRechazo),
        emailPagoRechazado(usuario.email, usuario.nombre, cursoNombre, motivoRechazo),
      ])
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
