import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const SYSTEM_PROMPT = `Sos el asistente oficial de la Confederación Paraguaya de Básquetbol (CPB), el ente rector del básquetbol en Paraguay. Estás afiliada a FIBA y sos miembro de FIBA Américas. Tu sitio web es cpb.com.py. Tu tono es formal pero accesible, típico de una federación deportiva latinoamericana. Respondé siempre en español.`

// Claude for admin features (high quality)
async function callClaude(userPrompt: string, maxTokens = 2000) {
  if (!anthropic) throw new Error("API de IA no configurada")

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  })

  return message.content[0].type === "text" ? message.content[0].text : ""
}

// Nvidia NIM for chatbot (free)
async function callNvidia(userPrompt: string) {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) throw new Error("NVIDIA API key no configurada")

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => "")
    console.error("Nvidia API error:", err)
    throw new Error("Error en API de Nvidia")
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ""
}

// Admin-only auth check
async function checkAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) return false

  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
  })
  return adminRoles.length > 0
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, tipo, contexto } = body

    // Chatbot público no requiere auth, el resto sí
    if (tipo !== "chatbot") {
      const isAdmin = await checkAdmin()
      if (!isAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    if (!prompt) {
      return NextResponse.json({ error: "Se requiere un prompt" }, { status: 400 })
    }

    // ─── GENERAR NOTICIA ────────────────────────────────
    if (tipo === "generar-noticia") {
      const text = await callClaude(`Generá una noticia profesional basada en esta información:

"${prompt}"

Respondé SOLO con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "titulo": "Título de la noticia (máximo 80 caracteres)",
  "slug": "titulo-en-formato-url-sin-acentos",
  "extracto": "Resumen de 1-2 oraciones (máximo 200 caracteres)",
  "contenido": "<p>Contenido HTML completo con múltiples párrafos. Usá <p>, <strong>, <em>. Mínimo 3 párrafos.</p>",
  "categoria": "GENERAL"
}

Categorías válidas: GENERAL, TORNEOS, SELECCIONES, ARBITRAJE, INSTITUCIONAL, CLUBES.`)

      try {
        return NextResponse.json({ result: JSON.parse(text) })
      } catch {
        return NextResponse.json({ error: "Error al procesar respuesta", raw: text }, { status: 500 })
      }
    }

    // ─── GENERAR CONTENIDO PÁGINA ───────────────────────
    if (tipo === "generar-pagina") {
      const text = await callClaude(`Generá contenido HTML para una página institucional de la CPB basado en esta descripción:

"${prompt}"

Respondé SOLO con un JSON válido (sin markdown, sin backticks):
{
  "titulo": "Título de la sección",
  "contenido": "<div>Contenido HTML completo y bien formateado con <h3>, <p>, <ul>, <li>, <strong>. Mínimo 4 párrafos con información detallada.</div>"
}

El contenido debe ser informativo, profesional y detallado.`, 3000)

      try {
        return NextResponse.json({ result: JSON.parse(text) })
      } catch {
        return NextResponse.json({ error: "Error al procesar respuesta", raw: text }, { status: 500 })
      }
    }

    // ─── RESPUESTA A MENSAJE DE CONTACTO ────────────────
    if (tipo === "responder-contacto") {
      const text = await callClaude(`Un visitante del sitio web de la CPB envió este mensaje de contacto:

Nombre: ${contexto?.nombre || ""}
Asunto: ${contexto?.asunto || ""}
Mensaje: "${prompt}"

Generá una respuesta profesional y cordial en nombre de la CPB. La respuesta debe:
- Saludar al remitente por su nombre
- Abordar específicamente su consulta
- Ser concisa pero completa
- Cerrar con un saludo formal

Respondé SOLO con un JSON válido (sin markdown, sin backticks):
{
  "asunto": "Re: Asunto original - CPB",
  "respuesta": "Texto completo de la respuesta en formato plano (no HTML)"
}`)

      try {
        return NextResponse.json({ result: JSON.parse(text) })
      } catch {
        return NextResponse.json({ error: "Error al procesar respuesta", raw: text }, { status: 500 })
      }
    }

    // ─── GENERAR CIRCULAR/COMUNICADO ────────────────────
    if (tipo === "generar-circular") {
      const text = await callClaude(`Generá un comunicado oficial / circular de la Confederación Paraguaya de Básquetbol basado en esta información:

"${prompt}"

Respondé SOLO con un JSON válido (sin markdown, sin backticks):
{
  "titulo": "Título del comunicado",
  "slug": "titulo-en-formato-url-sin-acentos",
  "extracto": "Resumen de 1-2 oraciones",
  "contenido": "<div class='comunicado'><p style='text-align:center'><strong>CONFEDERACIÓN PARAGUAYA DE BÁSQUETBOL</strong></p><p style='text-align:center'><strong>COMUNICADO OFICIAL</strong></p><hr/><p>Contenido del comunicado...</p><p>Se emite el presente comunicado para conocimiento de todos los interesados.</p><p style='text-align:right'><strong>Confederación Paraguaya de Básquetbol</strong><br/>Asunción, Paraguay</p></div>",
  "categoria": "INSTITUCIONAL"
}

El tono debe ser formal e institucional. Incluí fecha, formato de comunicado oficial con encabezado y cierre.`, 2500)

      try {
        return NextResponse.json({ result: JSON.parse(text) })
      } catch {
        return NextResponse.json({ error: "Error al procesar respuesta", raw: text }, { status: 500 })
      }
    }

    // ─── CHATBOT PÚBLICO (Nvidia NIM - gratuito) ─────────
    if (tipo === "chatbot") {
      const chatPrompt = `Un visitante del sitio web cpb.com.py hace esta consulta:

"${prompt}"

Respondé de manera breve, amigable y útil. Si la pregunta es sobre:
- Calendario/partidos: dirigilo a cpb.com.py/calendario
- Posiciones/tabla: dirigilo a cpb.com.py/posiciones
- Estadísticas: dirigilo a cpb.com.py/estadisticas
- Registrarse como árbitro/oficial: dirigilo a cpb.com.py/oficiales/registro
- Cuerpo técnico: dirigilo a cpb.com.py/cuerpotecnico/registro
- Reglamentos: dirigilo a cpb.com.py/reglamentos
- Contacto: dirigilo a cpb.com.py/contacto o email cpb@cpb.com.py
- Clubes: dirigilo a cpb.com.py/clubes
- Selecciones nacionales: dirigilo a cpb.com.py/selecciones

Si no sabés la respuesta, sugerí que contacten a cpb@cpb.com.py.
Respondé en máximo 3 oraciones cortas. No uses markdown, solo texto plano.`

      try {
        // Intentar con Nvidia (gratis)
        const text = await callNvidia(chatPrompt)
        return NextResponse.json({ result: { respuesta: text } })
      } catch {
        // Fallback a Claude si Nvidia falla
        if (anthropic) {
          const text = await callClaude(chatPrompt, 300)
          return NextResponse.json({ result: { respuesta: text.trim() } })
        }
        return NextResponse.json({ result: { respuesta: "Disculpá, no pude procesar tu consulta. Podés escribirnos a cpb@cpb.com.py." } })
      }
    }

    return NextResponse.json({ error: "Tipo de generación no válido" }, { status: 400 })
  } catch (error: any) {
    console.error("Error AI:", error)
    return NextResponse.json({ error: "Error interno de IA" }, { status: 500 })
  }
}
