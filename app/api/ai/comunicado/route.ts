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
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su } } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

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
      return NextResponse.json({ error: "IA no configurada" }, { status: 503 })
    }

    const { instruccion, destinatarios } = await request.json()

    if (!instruccion?.trim()) {
      return NextResponse.json({ error: "Describí el comunicado que querés generar" }, { status: 400 })
    }

    const dest = destinatarios ? `El comunicado va dirigido a: ${destinatarios}.` : ""

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Sos el redactor oficial de comunicados internos de la Confederación Paraguaya de Básquetbol (CPB). Escribís en español, tono institucional pero cercano. Nunca inventás datos — si falta algo dejás [DATO PENDIENTE].

${dest}

Generá un comunicado basándote en esta instrucción:
"${instruccion}"

Respondé ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin explicaciones):
{
  "titulo": "Título del comunicado (máximo 10 palabras)",
  "mensaje": "Cuerpo del mensaje. Podés usar saltos de línea para separar párrafos. Tono directo y claro. Firmá siempre al final con: Saludos,\\nCPB Paraguay"
}`,
        },
      ],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""

    let resultado: { titulo: string; mensaje: string }
    try {
      resultado = JSON.parse(raw)
    } catch {
      // Try to extract JSON from the response if wrapped in markdown
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: "La IA no pudo generar el comunicado. Intentá de nuevo." }, { status: 500 })
      }
      resultado = JSON.parse(match[0])
    }

    return NextResponse.json(resultado)
  } catch {
    return NextResponse.json({ error: "Error al generar el comunicado" }, { status: 500 })
  }
}
