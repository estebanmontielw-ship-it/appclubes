import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
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
      where: { usuarioId: session.user.id, rol: { in: ["SUPER_ADMIN", "INSTRUCTOR"] } },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { titulo, descripcion, contenido, videoUrl, archivoUrl, duracion } = body

    if (!titulo) {
      return NextResponse.json({ error: "Título es requerido" }, { status: 400 })
    }

    // Get next order number
    const lastModulo = await prisma.modulo.findFirst({
      where: { cursoId: params.id },
      orderBy: { orden: "desc" },
      select: { orden: true },
    })
    const nextOrden = (lastModulo?.orden ?? 0) + 1

    const modulo = await prisma.modulo.create({
      data: {
        cursoId: params.id,
        titulo,
        descripcion: descripcion || null,
        contenido: contenido || null,
        videoUrl: videoUrl || null,
        archivoUrl: archivoUrl || null,
        duracion: duracion || null,
        orden: nextOrden,
      },
    })

    return NextResponse.json({ modulo }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
