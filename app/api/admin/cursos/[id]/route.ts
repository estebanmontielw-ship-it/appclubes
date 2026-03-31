import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const curso = await prisma.curso.findUnique({
      where: { id: params.id },
      include: {
        modulos: {
          orderBy: { orden: "asc" },
          include: { examen: { include: { preguntas: { include: { opciones: true }, orderBy: { orden: "asc" } } } } },
        },
        instructor: { select: { nombre: true, apellido: true } },
        _count: { select: { inscripciones: true } },
      },
    })

    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ curso })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

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
    const { nombre, descripcion, disciplina, nivel, precio, esGratuito, estado, imagen, instructorId } = body

    const curso = await prisma.curso.update({
      where: { id: params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(disciplina !== undefined && { disciplina }),
        ...(nivel !== undefined && { nivel }),
        ...(precio !== undefined && { precio }),
        ...(esGratuito !== undefined && { esGratuito }),
        ...(estado !== undefined && { estado }),
        ...(imagen !== undefined && { imagen }),
        ...(instructorId !== undefined && { instructorId: instructorId || null }),
      },
    })

    return NextResponse.json({ curso })
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
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // SUPER_ADMIN can force delete — clean up related data first
    const cursoId = params.id

    // Delete in order: respuestas → examenes preguntas/opciones → progreso → pagos → inscripciones → secciones → modulos → certificados → curso
    await prisma.respuestaExamen.deleteMany({
      where: { examen: { modulo: { cursoId } } },
    })
    await prisma.opcion.deleteMany({
      where: { pregunta: { examen: { modulo: { cursoId } } } },
    })
    await prisma.pregunta.deleteMany({
      where: { examen: { modulo: { cursoId } } },
    })
    await prisma.examen.deleteMany({
      where: { modulo: { cursoId } },
    })
    await prisma.progresoModulo.deleteMany({
      where: { modulo: { cursoId } },
    })
    await prisma.pago.deleteMany({
      where: { inscripcion: { cursoId } },
    })
    await prisma.inscripcion.deleteMany({
      where: { cursoId },
    })
    await prisma.certificado.deleteMany({
      where: { cursoId },
    })

    await prisma.curso.delete({ where: { id: cursoId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
