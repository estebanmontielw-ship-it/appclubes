import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

// Mark module as completed
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

    const { moduloId } = await request.json()

    if (!moduloId) {
      return NextResponse.json({ error: "moduloId requerido" }, { status: 400 })
    }

    // Verify user is inscribed and active
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { usuarioId_cursoId: { usuarioId: session.user.id, cursoId: params.id } },
    })

    if (!inscripcion || inscripcion.estado !== "ACTIVO") {
      return NextResponse.json({ error: "No estás inscripto o tu inscripción no está activa" }, { status: 403 })
    }

    // Verify module belongs to this course
    const modulo = await prisma.modulo.findFirst({
      where: { id: moduloId, cursoId: params.id },
      select: { id: true, orden: true },
    })

    if (!modulo) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 })
    }

    // Check sequential: previous modules must be completed
    if (modulo.orden > 1) {
      const prevModulos = await prisma.modulo.findMany({
        where: { cursoId: params.id, orden: { lt: modulo.orden } },
        select: { id: true },
      })
      const prevCompleted = await prisma.progresoModulo.count({
        where: {
          usuarioId: session.user.id,
          moduloId: { in: prevModulos.map((m) => m.id) },
          completado: true,
        },
      })
      if (prevCompleted < prevModulos.length) {
        return NextResponse.json(
          { error: "Debés completar los módulos anteriores primero" },
          { status: 400 }
        )
      }
    }

    // Upsert progress
    const progreso = await prisma.progresoModulo.upsert({
      where: { usuarioId_moduloId: { usuarioId: session.user.id, moduloId } },
      create: {
        usuarioId: session.user.id,
        moduloId,
        completado: true,
        completadoEn: new Date(),
      },
      update: {
        completado: true,
        completadoEn: new Date(),
      },
    })

    // Check if all modules completed → update inscription
    const totalModulos = await prisma.modulo.count({ where: { cursoId: params.id } })
    const completedModulos = await prisma.progresoModulo.count({
      where: { usuarioId: session.user.id, completado: true, modulo: { cursoId: params.id } },
    })

    if (completedModulos >= totalModulos) {
      await prisma.inscripcion.update({
        where: { id: inscripcion.id },
        data: { estado: "COMPLETADO" },
      })
    }

    return NextResponse.json({ progreso, completed: completedModulos, total: totalModulos })
  } catch (error) {
    return handleApiError(error, { context: "cursos/[id]/progreso" })
  }
}
