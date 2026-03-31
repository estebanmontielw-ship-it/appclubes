import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

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
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
