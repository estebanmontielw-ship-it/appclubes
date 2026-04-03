import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET exam for user to take
export async function GET(
  _request: Request,
  { params }: { params: { id: string; examenId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const examen = await prisma.examen.findUnique({
      where: { id: params.examenId },
      include: {
        preguntas: {
          orderBy: { orden: "asc" },
          include: {
            opciones: {
              orderBy: { orden: "asc" },
              select: { id: true, texto: true, orden: true },
              // Don't expose esCorrecta to user
            },
          },
        },
      },
    })

    if (!examen) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ examen })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST - Submit exam answers
export async function POST(
  request: Request,
  { params }: { params: { id: string; examenId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { respuestas } = await request.json()
    // respuestas: [{ preguntaId, opcionId?, respuestaTexto? }]

    if (!respuestas?.length) {
      return NextResponse.json({ error: "Respuestas requeridas" }, { status: 400 })
    }

    const examen = await prisma.examen.findUnique({
      where: { id: params.examenId },
      include: {
        preguntas: {
          include: { opciones: true },
        },
      },
    })

    if (!examen) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 })
    }

    let totalPuntos = 0
    let obtenidos = 0
    let pendienteRevision = false

    const respuestasData = respuestas.map((r: any) => {
      const pregunta = examen.preguntas.find((p) => p.id === r.preguntaId)
      if (!pregunta) return null

      totalPuntos += pregunta.puntaje

      if (pregunta.tipo === "OPCION_MULTIPLE" && r.opcionId) {
        const opcion = pregunta.opciones.find((o) => o.id === r.opcionId)
        const esCorrecta = opcion?.esCorrecta || false
        if (esCorrecta) obtenidos += pregunta.puntaje

        return {
          usuarioId: session.user.id,
          examenId: params.examenId,
          preguntaId: r.preguntaId,
          opcionId: r.opcionId,
          esCorrecta,
          puntajeObtenido: esCorrecta ? pregunta.puntaje : 0,
        }
      } else {
        // Texto abierto — pending review
        pendienteRevision = true
        return {
          usuarioId: session.user.id,
          examenId: params.examenId,
          preguntaId: r.preguntaId,
          respuestaTexto: r.respuestaTexto || "",
          esCorrecta: null,
          puntajeObtenido: null,
        }
      }
    }).filter(Boolean)

    // Delete previous attempts
    await prisma.respuestaExamen.deleteMany({
      where: { usuarioId: session.user.id, examenId: params.examenId },
    })

    // Save answers
    await prisma.respuestaExamen.createMany({ data: respuestasData })

    const nota = totalPuntos > 0 ? Math.round((obtenidos / totalPuntos) * 100) : 0
    const aprobado = !pendienteRevision && nota >= examen.notaMinima

    return NextResponse.json({
      nota,
      aprobado,
      pendienteRevision,
      obtenidos,
      totalPuntos,
      notaMinima: examen.notaMinima,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
