import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export async function GET() {
  try {
    const selecciones = await prisma.seleccion.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    })
    return NextResponse.json({ selecciones })
  } catch (error) {
    return handleApiError(error, { context: "website/selecciones" })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()
    const { nombre, slug, categoria, genero, imagenUrl, descripcion, entrenador, logros, orden } = body

    if (!nombre || !slug || !categoria || !genero) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    const seleccion = await prisma.seleccion.create({
      data: {
        nombre, slug, categoria, genero,
        imagenUrl: imagenUrl || null,
        descripcion: descripcion || null,
        entrenador: entrenador || null,
        logros: logros || null,
        orden: orden ?? 0,
      },
    })

    return NextResponse.json({ seleccion }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una selección con ese slug" }, { status: 409 })
    }
    return handleApiError(error, { context: "website/selecciones" })
  }
}
