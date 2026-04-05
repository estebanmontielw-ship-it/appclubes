import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

export async function GET() {
  try {
    const auth = await requireRole("SUPER_ADMIN", "INSTRUCTOR")
    if (isAuthError(auth)) return auth

    const cursos = await prisma.curso.findMany({
      include: {
        modulos: { orderBy: { orden: "asc" }, select: { id: true } },
        _count: { select: { inscripciones: true } },
        instructor: { select: { nombre: true, apellido: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ cursos })
  } catch (error) {
    return handleApiError(error, { context: "admin/cursos" })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole("SUPER_ADMIN", "INSTRUCTOR")
    if (isAuthError(auth)) return auth

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
  } catch (error) {
    return handleApiError(error, { context: "admin/cursos" })
  }
}
