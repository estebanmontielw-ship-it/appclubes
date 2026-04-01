import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { notifCertificadoEmitido } from "@/lib/notifications"

// Generate certificate when course is completed
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { usuarioId_cursoId: { usuarioId: session.user.id, cursoId: params.id } },
      include: { curso: { select: { nombre: true } } },
    })

    if (!inscripcion || inscripcion.estado !== "COMPLETADO") {
      return NextResponse.json({ error: "Curso no completado" }, { status: 400 })
    }

    // Check if certificate already exists
    const existing = await prisma.certificado.findUnique({
      where: { usuarioId_cursoId: { usuarioId: session.user.id, cursoId: params.id } },
    })

    if (existing) {
      return NextResponse.json({ certificado: existing })
    }

    const certificado = await prisma.certificado.create({
      data: {
        usuarioId: session.user.id,
        cursoId: params.id,
      },
    })

    await notifCertificadoEmitido(session.user.id, inscripcion.curso.nombre)

    return NextResponse.json({ certificado }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// GET - Get certificate HTML
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const certificado = await prisma.certificado.findUnique({
      where: { usuarioId_cursoId: { usuarioId: session.user.id, cursoId: params.id } },
      include: {
        usuario: { select: { nombre: true, apellido: true, cedula: true } },
        curso: { select: { nombre: true, disciplina: true, nivel: true } },
      },
    })

    if (!certificado) {
      return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 })
    }

    const fecha = new Date(certificado.emitidoEn).toLocaleDateString("es-PY", {
      day: "2-digit", month: "long", year: "numeric",
    })

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Certificado CPB</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
  .cert { width: 800px; background: white; border: 3px solid #f97316; border-radius: 8px; padding: 60px; text-align: center; position: relative; }
  .cert::before { content: ''; position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; border: 1px solid #fed7aa; border-radius: 4px; }
  .logo { font-size: 28px; font-weight: bold; color: #f97316; margin-bottom: 8px; }
  .org { font-size: 14px; color: #6b7280; margin-bottom: 30px; }
  h1 { font-size: 36px; color: #1f2937; margin-bottom: 20px; letter-spacing: 4px; text-transform: uppercase; }
  .recipient { font-size: 28px; color: #f97316; border-bottom: 2px solid #fed7aa; padding-bottom: 8px; display: inline-block; margin-bottom: 16px; }
  .ci { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
  .course { font-size: 18px; color: #374151; margin-bottom: 8px; }
  .detail { font-size: 14px; color: #6b7280; margin-bottom: 30px; }
  .date { font-size: 14px; color: #6b7280; }
  .code { font-size: 11px; color: #9ca3af; margin-top: 20px; }
  @media print { body { background: white; } .cert { box-shadow: none; border: 3px solid #f97316; } }
</style>
</head>
<body>
<div class="cert">
  <img src="${process.env.NEXT_PUBLIC_BASE_URL}/logo-cpb.jpg" alt="CPB" style="height:48px;width:48px;object-fit:contain;margin:0 auto 8px;" />
  <div class="org">Confederación Paraguaya de Básquetbol</div>
  <h1>Certificado</h1>
  <p style="font-size: 16px; color: #6b7280; margin-bottom: 16px;">Se certifica que</p>
  <div class="recipient">${certificado.usuario.nombre} ${certificado.usuario.apellido}</div>
  <div class="ci">CI: ${certificado.usuario.cedula}</div>
  <div class="course">ha completado satisfactoriamente el curso</div>
  <div style="font-size: 22px; font-weight: bold; color: #1f2937; margin: 12px 0 8px;">"${certificado.curso.nombre}"</div>
  <div class="detail">${certificado.curso.disciplina} — Nivel ${certificado.curso.nivel}</div>
  <div class="date">Emitido el ${fecha}</div>
  <div class="code">Código: ${certificado.qrToken}</div>
</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
