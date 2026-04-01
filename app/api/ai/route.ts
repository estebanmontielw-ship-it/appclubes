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

// Nvidia NIM (free) - two models
async function callNvidia(userPrompt: string, model: "chatbot" | "admin" = "chatbot", maxTokens = 300) {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) throw new Error("NVIDIA API key no configurada")

  const modelId = model === "admin"
    ? "meta/llama-4-maverick-17b-128e-instruct"
    : "meta/llama-4-maverick-17b-128e-instruct"

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text().catch(() => "")
      console.error("Nvidia API error:", res.status, err)
      throw new Error(`Nvidia API error: ${res.status}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ""
    if (!content) throw new Error("Respuesta vacía de Nvidia")
    return content
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

// Helper: try Nvidia first, fallback to Claude
async function callAI(userPrompt: string, maxTokens = 2000) {
  try {
    return await callNvidia(userPrompt, "admin", maxTokens)
  } catch (err) {
    console.error("Nvidia failed, trying Claude fallback:", err)
    // Fallback to Claude
    if (anthropic) return await callClaude(userPrompt, maxTokens)
    throw new Error("Ninguna API de IA disponible")
  }
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
      const text = await callAI(`Generá una noticia profesional basada en esta información:

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
      const text = await callAI(`Generá contenido HTML para una página institucional de la CPB basado en esta descripción:

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
      const text = await callAI(`Un visitante del sitio web de la CPB envió este mensaje de contacto:

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
      const text = await callAI(`Generá un comunicado oficial / circular de la Confederación Paraguaya de Básquetbol basado en esta información:

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

    // ─── ANALIZAR IMAGEN CON IA (Kimi k2.5 - gratis) ──────
    if (tipo === "analizar-imagen") {
      const apiKey = process.env.NVIDIA_API_KEY
      if (!apiKey) return NextResponse.json({ error: "NVIDIA API key no configurada" }, { status: 500 })

      try {
        const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "moonshotai/kimi-k2.5",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: prompt },
                  },
                  {
                    type: "text",
                    text: "Analizá esta imagen de la Confederación Paraguaya de Básquetbol. Describí detalladamente qué se ve: personas, equipos, logos, texto visible, evento, lugar, acción deportiva. Respondé en español, máximo 4 oraciones. Solo texto plano, sin markdown.",
                  },
                ],
              },
            ],
            max_tokens: 500,
            temperature: 0.5,
          }),
        })

        if (!res.ok) throw new Error("Kimi API error")
        const data = await res.json()
        const analisis = data.choices?.[0]?.message?.content?.trim() || "No se pudo analizar la imagen."
        return NextResponse.json({ result: { analisis } })
      } catch (err) {
        console.error("Kimi vision error:", err)
        return NextResponse.json({ result: { analisis: "No se pudo analizar la imagen. Podés describir el contenido manualmente." } })
      }
    }

    // ─── IMPORTAR POST DE INSTAGRAM ───────────────────────
    if (tipo === "importar-instagram") {
      const text = await callAI(`Tenés un post de Instagram de la Confederación Paraguaya de Básquetbol con este contenido:

"${prompt}"

Convertilo en una noticia profesional para el sitio web. Expandí el texto del post en un artículo más completo y formal.

Respondé SOLO con un JSON válido (sin markdown, sin backticks):
{
  "titulo": "Título de la noticia (máximo 80 caracteres)",
  "slug": "titulo-en-formato-url-sin-acentos",
  "extracto": "Resumen de 1-2 oraciones (máximo 200 caracteres)",
  "contenido": "<p>Contenido HTML completo expandido del post. Mínimo 3 párrafos. Usá <p>, <strong>, <em>.</p>",
  "categoria": "GENERAL"
}

Categorías válidas: GENERAL, TORNEOS, SELECCIONES, ARBITRAJE, INSTITUCIONAL, CLUBES.
Eliminá hashtags y emojis del título y extracto. Podés mantenerlos en el contenido si tienen sentido.`)

      try {
        return NextResponse.json({ result: JSON.parse(text) })
      } catch {
        return NextResponse.json({ error: "Error al procesar respuesta", raw: text }, { status: 500 })
      }
    }

    // ─── BUSCADOR INTELIGENTE ───────────────────────────
    if (tipo === "buscar") {
      const text = await callNvidia(`Un visitante de cpb.com.py busca: "${prompt}"

Determiná a qué página del sitio debe ir. Las opciones son:
- /calendario - para partidos, fixture, calendario, fechas de juegos
- /posiciones - para tabla de posiciones, clasificación, standings
- /estadisticas - para stats de jugadores, goleadores, rebotes, asistencias
- /noticias - para noticias, novedades, artículos
- /clubes - para clubes, equipos afiliados
- /selecciones - para selecciones nacionales, selección paraguaya
- /reglamentos - para reglas, reglamentos, normas, documentos oficiales
- /institucional - para info sobre la CPB, historia, autoridades
- /contacto - para contacto, teléfono, email, dirección
- /oficiales/registro - para registrarse como árbitro u oficial
- /cuerpotecnico/registro - para registrarse como entrenador o cuerpo técnico

Respondé SOLO con un JSON válido (sin markdown, sin backticks):
{
  "url": "/la-ruta-mas-relevante",
  "mensaje": "Texto breve explicando a dónde lo estás dirigiendo (1 oración)"
}`, "chatbot", 200)

      try {
        const result = JSON.parse(text)
        return NextResponse.json({ result })
      } catch {
        return NextResponse.json({ result: { url: "/", mensaje: "No pude determinar lo que buscás. Probá navegando desde el inicio." } })
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
