import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    const userId = session?.user?.id

    const curso = await prisma.curso.findUnique({
      where: { id: params.id },
      include: {
        modulos: {
          orderBy: { orden: "asc" },
          include: {
            examen: { select: { id: true, titulo: true } },
            secciones: { orderBy: { orden: "asc" } },
            ...(userId
              ? {
                  progresos: {
                    where: { usuarioId: userId },
                    select: { completado: true, completadoEn: true },
                  },
                }
              : {}),
          },
        },
        instructor: { select: { nombre: true, apellido: true } },
        ...(userId
          ? {
              inscripciones: {
                where: { usuarioId: userId },
                select: { id: true, estado: true },
              },
            }
          : {}),
      },
    })

    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ curso })
  } catch (error) {
    return handleApiError(error, { context: "cursos/[id]" })
  }
}
