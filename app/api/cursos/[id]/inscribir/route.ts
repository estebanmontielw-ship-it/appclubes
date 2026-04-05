import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export async function POST(
  _request: Request,
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

    const curso = await prisma.curso.findUnique({
      where: { id: params.id },
      select: { esGratuito: true, estado: true },
    })

    if (!curso || curso.estado !== "ACTIVO") {
      return NextResponse.json({ error: "Curso no disponible" }, { status: 400 })
    }

    // Check existing inscription
    const existing = await prisma.inscripcion.findUnique({
      where: { usuarioId_cursoId: { usuarioId: session.user.id, cursoId: params.id } },
    })

    if (existing) {
      return NextResponse.json({ error: "Ya estás inscripto en este curso" }, { status: 400 })
    }

    const inscripcion = await prisma.inscripcion.create({
      data: {
        usuarioId: session.user.id,
        cursoId: params.id,
        estado: curso.esGratuito ? "ACTIVO" : "PENDIENTE_PAGO",
      },
    })

    return NextResponse.json({ inscripcion }, { status: 201 })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/cursos/inscribir" })
  }
}
