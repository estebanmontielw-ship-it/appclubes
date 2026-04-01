import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function POST(request: Request) {
  try {
    // Auth check
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

    if (!anthropic) {
      return NextResponse.json({ error: "API de IA no configurada" }, { status: 500 })
    }

    const body = await request.json()
    const { prompt, tipo } = body

    if (!prompt) {
      return NextResponse.json({ error: "Se requiere un prompt" }, { status: 400 })
    }

    if (tipo === "generar-noticia") {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `Sos el redactor oficial de la Confederación Paraguaya de Básquetbol (CPB).
Generá una noticia profesional en español basada en la siguiente información:

"${prompt}"

Respondé SOLO con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "titulo": "Título de la noticia (máximo 80 caracteres)",
  "slug": "titulo-en-formato-url-sin-acentos",
  "extracto": "Resumen de 1-2 oraciones (máximo 200 caracteres)",
  "contenido": "<p>Contenido HTML completo de la noticia con múltiples párrafos. Usá tags <p>, <strong>, <em> para formatear. Mínimo 3 párrafos.</p>",
  "categoria": "GENERAL"
}

La categoría debe ser una de: GENERAL, TORNEOS, SELECCIONES, ARBITRAJE, INSTITUCIONAL, CLUBES.
El tono debe ser formal pero accesible, típico de una federación deportiva.`,
          },
        ],
      })

      const text = message.content[0].type === "text" ? message.content[0].text : ""

      try {
        const result = JSON.parse(text)
        return NextResponse.json({ result })
      } catch {
        return NextResponse.json({ error: "Error al procesar respuesta de IA", raw: text }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Tipo de generación no válido" }, { status: 400 })
  } catch (error: any) {
    console.error("Error AI:", error)
    return NextResponse.json({ error: "Error interno de IA" }, { status: 500 })
  }
}
