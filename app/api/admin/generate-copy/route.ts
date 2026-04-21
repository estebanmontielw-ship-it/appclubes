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
Escribís copys para Instagram en español rioplatense (vos, sos, etc.).
Usás un tono apasionado, directo, con energía, pero sin exagerar con mayúsculas ni exclamaciones.
Siempre incluís hashtags relevantes al final. Los hashtags son siempre en minúsculas y sin espacios.
Los copys son concisos, entre 3 y 6 líneas de texto más los hashtags.`

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
