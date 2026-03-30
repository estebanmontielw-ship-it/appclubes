import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
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
      where: { usuarioId: session.user.id, rol: { in: ["SUPER_ADMIN", "INSTRUCTOR"] } },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { titulo, descripcion, contenido, videoUrl, archivoUrl, duracion, orden } = body

    const modulo = await prisma.modulo.update({
      where: { id: params.id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(contenido !== undefined && { contenido }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(archivoUrl !== undefined && { archivoUrl }),
        ...(duracion !== undefined && { duracion }),
        ...(orden !== undefined && { orden }),
      },
    })

    return NextResponse.json({ modulo })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
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
      where: { usuarioId: session.user.id, rol: { in: ["SUPER_ADMIN", "INSTRUCTOR"] } },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    await prisma.modulo.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
