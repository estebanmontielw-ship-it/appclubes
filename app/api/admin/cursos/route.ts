import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        modulos: { orderBy: { orden: "asc" }, select: { id: true } },
        _count: { select: { inscripciones: true } },
        instructor: { select: { nombre: true, apellido: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ cursos })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
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
      where: { usuarioId: session.user.id, rol: { in: ["SUPER_ADMIN", "INSTRUCTOR"] } },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, descripcion, disciplina, nivel, precio, esGratuito, estado, imagen, instructorId } = body

    if (!nombre || !descripcion || !disciplina || !nivel) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const curso = await prisma.curso.create({
      data: {
        nombre,
        descripcion,
        disciplina,
        nivel,
        precio: esGratuito ? 0 : (precio || 0),
        esGratuito: esGratuito || false,
        estado: estado || "BORRADOR",
        imagen: imagen || null,
        instructorId: instructorId || null,
      },
    })

    return NextResponse.json({ curso }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
