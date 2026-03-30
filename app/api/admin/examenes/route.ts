import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// Create exam for a module
export async function POST(request: Request) {
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

    const { moduloId, titulo, instrucciones, notaMinima, preguntas } = await request.json()

    if (!moduloId || !titulo) {
      return NextResponse.json({ error: "moduloId y título requeridos" }, { status: 400 })
    }

    // Check if module already has an exam
    const existing = await prisma.examen.findUnique({ where: { moduloId } })
    if (existing) {
      return NextResponse.json({ error: "Este módulo ya tiene un examen" }, { status: 400 })
    }

    const examen = await prisma.examen.create({
      data: {
        moduloId,
        titulo,
        instrucciones: instrucciones || null,
        notaMinima: notaMinima || 70,
        preguntas: preguntas?.length
          ? {
              create: preguntas.map((p: any, idx: number) => ({
                texto: p.texto,
                tipo: p.tipo,
                orden: idx + 1,
                puntaje: p.puntaje || 1,
                opciones: p.opciones?.length
                  ? {
                      create: p.opciones.map((o: any, oIdx: number) => ({
                        texto: o.texto,
                        esCorrecta: o.esCorrecta || false,
                        orden: oIdx + 1,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: { preguntas: { include: { opciones: true } } },
    })

    return NextResponse.json({ examen }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
