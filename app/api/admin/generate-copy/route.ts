import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

const LIGA_LABELS: Record<string, string> = {
  lnb:  "Liga Nacional de Básquet (LNB)",
  lnbf: "Liga Nacional de Básquet Femenino (LNBF)",
  u22m: "Torneo Sub 22 Masculino",
  u22f: "Torneo Sub 22 Femenino",
}

interface MatchInfo {
  homeName: string
  awayName: string
  homeScore?: string | null
  awayScore?: string | null
  date?: string
  time?: string
  venue?: string
}

export async function POST(req: NextRequest) {
  // Auth check
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const body = await req.json()
  const {
    matches,
    template,
    liga,
    titulo,
    subtitulo,
  }: {
    matches: MatchInfo[]
    template: "pre" | "resultado"
    liga: string
    titulo?: string
    subtitulo?: string
  } = body

  if (!matches?.length) {
    return NextResponse.json({ error: "Se requieren datos de partidos" }, { status: 400 })
  }

  const isResultado = template === "resultado"
  const ligaLabel = LIGA_LABELS[liga] ?? liga.toUpperCase()

  const matchLines = matches.map((m) => {
    if (isResultado && m.homeScore != null && m.awayScore != null) {
      return `${m.homeName} ${m.homeScore} – ${m.awayScore} ${m.awayName}${m.venue ? ` (${m.venue})` : ""}${m.date ? ` · ${m.date}` : ""}`
    }
    return `${m.homeName} vs ${m.awayName}${m.venue ? ` en ${m.venue}` : ""}${m.date ? ` · ${m.date}` : ""}${m.time ? ` a las ${m.time} hs` : ""}`
  }).join("\n")

  const contextLines = [
    titulo && `Título del flyer: "${titulo}"`,
    subtitulo && `Subtítulo: "${subtitulo}"`,
  ].filter(Boolean).join("\n")

  const systemPrompt = `Sos el community manager oficial de la Confederación Paraguaya de Básquetbol (CPB).

## IDENTIDAD DE MARCA CPB
La CPB comunica: profesionalismo, orgullo nacional, competencia oficial, pasión por el básquet paraguayo, respeto institucional y energía deportiva.
El tono es: serio pero emocionante. No demasiado frío. No demasiado informal. No demasiado exagerado.
Proporción: 70% institucional · 20% deportivo · 10% emocional.

## ESTRUCTURA DE UN COPY CPB
1. Hook inicial (1 línea que atrape). Ejemplos: "🔥 Se viene una fecha clave…", "🏀 Continúa la acción…", "⚡ Todo listo para una nueva jornada…", "👀 La definición está cada vez más cerca…", "🇵🇾 El básquet paraguayo no se detiene…"
2. Información principal: qué es (LNB, LNBF, U22, Selección, etc.) y qué se juega.
3. Contexto / emoción: por qué importa (pelea por Top 4, definición de posiciones, partidos decisivos, recta final).
4. CTA: pregunta o invitación a interacción. Ejemplos: "¿Quién gana?", "¿Tu candidato?", "Comentá tu favorito.", "¿El partido de la fecha?"
5. Hashtags: pocos y limpios. Siempre incluir #CPB y el hashtag de la liga correspondiente (#LNB2025, #LNBF2025, #U222025). 3 a 5 hashtags máximo.

## FÓRMULAS POR TIPO DE POST
- FIXTURE/FECHA: Hook + Jornada + Importancia + CTA
- RESULTADOS: Hook + destacar la jornada + qué se movió + CTA pidiendo opinión
- PREVIA PARTIDAZO: Hook de tensión + contexto de por qué es clave + CTA de expectativa

## PALABRAS QUE SUMAN
jornada, definición, clasificación, recta final, duelo clave, protagonistas, historia, pasión, competencia, orgullo nacional, nivel, acción.

## COSAS QUE NO HACER
- No repetir datos que ya están en el flyer (equipos, horarios).
- No usar mucho texto. Instagram premia la simpleza.
- No sonar amateur: evitar "se juega lindo partido", "vengan todos", frases genéricas.
- Máximo 2 a 4 emojis por copy.
- No más de 3 a 5 hashtags.
- No poner mayúsculas en todos los hashtags — van en minúsculas y sin espacios.

## EJEMPLO PLANTILLA EXPRESS
"🔥 [Hook]
[Qué pasa]
[Por qué importa]
[Pregunta final]
#CPB #LNB2025"

## IDIOMA Y REGISTRO
Español rioplatense (vos, sos, etc.). Nunca tutear. Nunca usar "tú" o "usted".
Los copys tienen entre 3 y 6 líneas de texto más los hashtags al final.`

  const userPrompt = isResultado
    ? `Generá 3 copys distintos para Instagram anunciando estos resultados de la ${ligaLabel}:
${matchLines}
${contextLines ? `\nContexto adicional:\n${contextLines}` : ""}

Cada copy debe tener un tono y enfoque diferente:
1. Celebratorio / emocionante
2. Informativo / profesional
3. Con pregunta o llamada a la acción para los seguidores

Devolvé exactamente 3 copys separados por una línea con "---" entre cada uno. Sin numeración ni títulos.`
    : `Generá 3 copys distintos para Instagram anunciando estos próximos partidos de la ${ligaLabel}:
${matchLines}
${contextLines ? `\nContexto adicional:\n${contextLines}` : ""}

Cada copy debe tener un tono y enfoque diferente:
1. Generando expectativa / hype
2. Informativo con los detalles del partido
3. Invitando a la gente / llamada a la acción

Devolvé exactamente 3 copys separados por una línea con "---" entre cada uno. Sin numeración ni títulos.`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""
    const copies = raw.split(/\n---\n/).map((s) => s.trim()).filter(Boolean)

    return NextResponse.json({ copies })
  } catch (e: any) {
    console.error("generate-copy error:", e)
    return NextResponse.json({ error: e.message ?? "Error al generar el copy" }, { status: 500 })
  }
}
