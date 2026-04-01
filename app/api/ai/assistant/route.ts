import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

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

async function getSystemContext() {
  try {
    const [
      totalUsuarios,
      usuariosPendientes,
      usuariosVerificados,
      totalCT,
      ctPendientes,
      totalPartidos,
      partidosProgramados,
      totalCursos,
      totalInscripciones,
      pagosPendientes,
      totalNoticias,
      noticiasPublicadas,
      totalClubes,
      totalSelecciones,
      totalReglamentos,
      mensajesSinLeer,
      ultimasNoticias,
      ultimosUsuarios,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { estadoVerificacion: "PENDIENTE" } }),
      prisma.usuario.count({ where: { estadoVerificacion: "VERIFICADO" } }),
      prisma.cuerpoTecnico.count(),
      prisma.cuerpoTecnico.count({ where: { estadoHabilitacion: "PENDIENTE" } }),
      prisma.partido.count(),
      prisma.partido.count({ where: { estado: "PROGRAMADO" } }),
      prisma.curso.count(),
      prisma.inscripcion.count(),
      prisma.pago.count({ where: { estado: "PENDIENTE_REVISION" } }),
      prisma.noticia.count(),
      prisma.noticia.count({ where: { publicada: true } }),
      prisma.club.count({ where: { activo: true } }),
      prisma.seleccion.count({ where: { activo: true } }),
      prisma.reglamento.count({ where: { activo: true } }),
      prisma.mensajeContacto.count({ where: { leido: false } }),
      prisma.noticia.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { titulo: true, publicada: true, createdAt: true } }),
      prisma.usuario.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { nombre: true, apellido: true, estadoVerificacion: true, createdAt: true } }),
    ])

    return `
DATOS ACTUALES DEL SISTEMA CPB (en tiempo real):

OFICIALES:
- Total registrados: ${totalUsuarios}
- Pendientes de verificación: ${usuariosPendientes}
- Verificados: ${usuariosVerificados}

CUERPO TÉCNICO:
- Total registrados: ${totalCT}
- Pendientes de habilitación: ${ctPendientes}

PARTIDOS:
- Total partidos: ${totalPartidos}
- Programados: ${partidosProgramados}

CURSOS:
- Total cursos: ${totalCursos}
- Total inscripciones: ${totalInscripciones}
- Pagos pendientes de revisión: ${pagosPendientes}

SITIO WEB:
- Noticias total: ${totalNoticias} (${noticiasPublicadas} publicadas)
- Clubes cargados: ${totalClubes}
- Selecciones cargadas: ${totalSelecciones}
- Reglamentos cargados: ${totalReglamentos}
- Mensajes de contacto sin leer: ${mensajesSinLeer}

ÚLTIMAS NOTICIAS:
${ultimasNoticias.map(n => `- "${n.titulo}" (${n.publicada ? "publicada" : "borrador"})`).join("\n")}

ÚLTIMOS REGISTROS:
${ultimosUsuarios.map(u => `- ${u.nombre} ${u.apellido} (${u.estadoVerificacion})`).join("\n")}
`
  } catch (err) {
    console.error("Error getting system context:", err)
    return "No se pudieron obtener los datos del sistema."
  }
}

async function callNvidia(systemPrompt: string, userMessage: string, history: any[]) {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) throw new Error("NVIDIA API key no configurada")

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10), // Last 10 messages for context
    { role: "user", content: userMessage },
  ]

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta/llama-4-maverick-17b-128e-instruct",
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) throw new Error("Nvidia API error")
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ""
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const userId = session.user.id
    const { message, conversacionId, archivos } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 })
    }

    // Get or create conversation
    let convId = conversacionId
    if (!convId) {
      const conv = await prisma.conversacionBot.create({
        data: { usuarioId: userId, titulo: message.slice(0, 60), updatedAt: new Date() },
      })
      convId = conv.id
    }

    // Save user message
    await prisma.mensajeBot.create({
      data: {
        conversacionId: convId,
        role: "user",
        contenido: message,
        archivos: archivos?.length ? JSON.stringify(archivos) : null,
      },
    })

    // Get conversation history from DB
    const dbMessages = await prisma.mensajeBot.findMany({
      where: { conversacionId: convId },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { role: true, contenido: true, archivos: true },
    })

    const history = dbMessages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.contenido + (m.archivos ? `\n[Archivos adjuntos: ${m.archivos}]` : ""),
    }))

    // Analyze images with Kimi k2.5 vision (free)
    let fileContext = ""
    if (archivos?.length) {
      const imageFiles = archivos.filter((f: any) => f.type?.startsWith("image/") || f.name?.match(/\.(png|jpg|jpeg|webp|gif)$/i))
      const otherFiles = archivos.filter((f: any) => !f.type?.startsWith("image/") && !f.name?.match(/\.(png|jpg|jpeg|webp|gif)$/i))

      // Analyze each image with Kimi vision
      const imageDescriptions: string[] = []
      const apiKey = process.env.NVIDIA_API_KEY
      if (apiKey && imageFiles.length > 0) {
        for (const img of imageFiles) {
          try {
            const visionRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: "moonshotai/kimi-k2.5",
                messages: [{
                  role: "user",
                  content: [
                    { type: "image_url", image_url: { url: img.url } },
                    { type: "text", text: "Describí detalladamente qué se ve en esta imagen. Si hay texto, leelo. Si hay personas, describí qué hacen. Si hay logos o equipos, mencioná cuáles. Respondé en español, máximo 3 oraciones." },
                  ],
                }],
                max_tokens: 300,
                temperature: 0.5,
              }),
              signal: AbortSignal.timeout(15000),
            })
            if (visionRes.ok) {
              const visionData = await visionRes.json()
              const desc = visionData.choices?.[0]?.message?.content?.trim()
              if (desc) imageDescriptions.push(`${img.name}: ${desc}`)
            }
          } catch {}
        }
      }

      fileContext = `\n\nEl usuario adjuntó ${archivos.length} archivo(s).`
      if (imageDescriptions.length > 0) {
        fileContext += `\n\nANÁLISIS DE IMÁGENES (visión por IA):\n${imageDescriptions.join("\n")}`
      }
      if (otherFiles.length > 0) {
        fileContext += `\nOtros archivos: ${otherFiles.map((f: any) => f.name).join(", ")}`
      }
    }

    // Get real-time system data
    const systemData = await getSystemContext()

    const systemPrompt = `Sos CPB Bot, el asistente de inteligencia artificial del Super Admin de la Confederación Paraguaya de Básquetbol (CPB). Tu nombre es CPB Bot.

Tu personalidad:
- Sos eficiente, inteligente y proactivo
- Hablás en español rioplatense/paraguayo (vos, usás, tenés)
- Sos conciso pero completo
- Cuando detectás problemas o cosas pendientes, los mencionás proactivamente
- Usás datos reales del sistema para respaldar tus respuestas

Tus capacidades:
- Accedés a datos en tiempo real del sistema (usuarios, partidos, pagos, noticias, etc.)
- Podés dar resúmenes del estado de la CPB
- Podés sugerir acciones y prioridades
- Podés ayudar a redactar contenido (noticias, comunicados, notificaciones)
- Podés analizar tendencias y dar recomendaciones
- Podés analizar archivos que el usuario suba (imágenes, PDFs, planillas)

IMPORTANTE: Respondé en texto plano, sin markdown. Usá saltos de línea para separar párrafos. No uses asteriscos, guiones bajos ni hashtags para formatear.

${systemData}${fileContext}

Fecha actual: ${new Date().toLocaleDateString("es-PY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`

    const response = await callNvidia(systemPrompt, message, history)

    // Save assistant response
    await prisma.mensajeBot.create({
      data: { conversacionId: convId, role: "assistant", contenido: response },
    })

    // Update conversation title if first message
    if (dbMessages.length <= 1) {
      await prisma.conversacionBot.update({
        where: { id: convId },
        data: { titulo: message.slice(0, 60), updatedAt: new Date() },
      })
    } else {
      await prisma.conversacionBot.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      })
    }

    return NextResponse.json({ response, conversacionId: convId })
  } catch (error: any) {
    console.error("Assistant error:", error)
    return NextResponse.json({
      response: "Disculpá, tuve un problema procesando tu consulta. Intentá de nuevo en unos segundos.",
    })
  }
}
