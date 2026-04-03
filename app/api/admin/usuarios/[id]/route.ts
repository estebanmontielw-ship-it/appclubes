import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import {
  notifCarnetVerificado,
  notifCarnetRechazado,
} from "@/lib/notifications"
import {
  emailCarnetVerificado,
  emailCarnetRechazado,
} from "@/lib/email"

// GET - Get single user details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: {
        usuarioId: session.user.id,
        rol: { in: ["SUPER_ADMIN", "INSTRUCTOR", "VERIFICADOR"] },
      },
    })

    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
      include: {
        roles: true,
        inscripciones: {
          include: { curso: true, pagos: true },
        },
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ usuario })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// PATCH - Verify / Reject / Suspend user
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRolesCheck = await prisma.usuarioRol.findMany({
      where: {
        usuarioId: session.user.id,
        rol: { in: ["SUPER_ADMIN", "VERIFICADOR"] },
      },
    })

    if (adminRolesCheck.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const isVerificador = adminRolesCheck.some((r) => r.rol === "VERIFICADOR") &&
      !adminRolesCheck.some((r) => r.rol === "SUPER_ADMIN")

    const { accion, motivoRechazo } = await request.json()

    if (!["verificar", "rechazar", "suspender"].includes(accion)) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    }

    if (isVerificador && accion !== "verificar") {
      return NextResponse.json({ error: "Solo podés verificar usuarios" }, { status: 403 })
    }

    let updateData: Record<string, unknown> = {}

    if (accion === "verificar") {
      updateData = {
        estadoVerificacion: "VERIFICADO",
        verificadoPor: session.user.id,
        verificadoEn: new Date(),
        motivoRechazo: null,
      }
    } else if (accion === "rechazar") {
      if (!motivoRechazo) {
        return NextResponse.json(
          { error: "Motivo de rechazo requerido" },
          { status: 400 }
        )
      }
      updateData = {
        estadoVerificacion: "RECHAZADO",
        verificadoPor: session.user.id,
        verificadoEn: new Date(),
        motivoRechazo,
      }
    } else if (accion === "suspender") {
      updateData = {
        estadoVerificacion: "SUSPENDIDO",
        verificadoPor: session.user.id,
        verificadoEn: new Date(),
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: updateData,
      include: { roles: true },
    })

    // Send notification + email
    if (accion === "verificar") {
      await Promise.all([
        notifCarnetVerificado(params.id),
        emailCarnetVerificado(usuario.email, usuario.nombre),
      ])
    } else if (accion === "rechazar" && motivoRechazo) {
      await Promise.all([
        notifCarnetRechazado(params.id, motivoRechazo),
        emailCarnetRechazado(usuario.email, usuario.nombre, motivoRechazo),
      ])
    }

    return NextResponse.json({ usuario })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
