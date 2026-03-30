import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { notifDesignacionAsignada } from "@/lib/notifications"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: { in: ["SUPER_ADMIN", "DESIGNADOR"] } },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { usuarioId, rol, notas } = await request.json()

    if (!usuarioId || !rol) {
      return NextResponse.json({ error: "Usuario y rol son requeridos" }, { status: 400 })
    }

    // Verify user is verified
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { estadoVerificacion: true, nombre: true, apellido: true },
    })
    if (!usuario || usuario.estadoVerificacion !== "VERIFICADO") {
      return NextResponse.json({ error: "El usuario debe estar verificado" }, { status: 400 })
    }

    const partido = await prisma.partido.findUnique({
      where: { id: params.id },
      select: { equipoLocal: true, equipoVisit: true, fecha: true },
    })
    if (!partido) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 })
    }

    const designacion = await prisma.designacion.create({
      data: {
        partidoId: params.id,
        usuarioId,
        rol,
        notas: notas || null,
        asignadoPor: session.user.id,
      },
      include: { usuario: { select: { nombre: true, apellido: true } } },
    })

    // Send notification
    const partidoDesc = `${partido.equipoLocal} vs ${partido.equipoVisit}`
    await notifDesignacionAsignada(usuarioId, partidoDesc, rol)

    return NextResponse.json({ designacion }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { designacionId } = await request.json()
    await prisma.designacion.delete({ where: { id: designacionId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
