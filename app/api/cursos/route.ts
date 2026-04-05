import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    const userId = session?.user?.id

    const cursos = await prisma.curso.findMany({
      where: { estado: "ACTIVO" },
      include: {
        modulos: { orderBy: { orden: "asc" }, select: { id: true } },
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ cursos })
  } catch (error) {
    return handleApiError(error, { context: "cursos" })
  }
}
