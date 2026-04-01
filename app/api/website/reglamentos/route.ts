import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const reglamentos = await prisma.reglamento.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { orden: "asc" }],
    })
    return NextResponse.json({ reglamentos })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()
    const { titulo, descripcion, archivoUrl, categoria, orden } = body

    if (!titulo || !archivoUrl || !categoria) {
      return NextResponse.json({ error: "Titulo, archivo y categoría son requeridos" }, { status: 400 })
    }

    const reglamento = await prisma.reglamento.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        archivoUrl,
        categoria,
        orden: orden ?? 0,
      },
    })

    return NextResponse.json({ reglamento }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
