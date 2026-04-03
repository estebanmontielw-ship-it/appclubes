import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { TipoRecurso, CategoriaRecurso, DisciplinaCurso } from "@prisma/client"

export async function GET() {
  try {
    const recursos = await prisma.recurso.findMany({
      where: { activo: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ recursos })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
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

    const body = await request.json()
    const { titulo, descripcion, tipo, categoria, url, disciplina, esPublico } = body

    if (!titulo || !tipo || !url) {
      return NextResponse.json({ error: "Título, tipo y URL son requeridos" }, { status: 400 })
    }

    const recurso = await prisma.recurso.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        tipo: tipo as TipoRecurso,
        categoria: (categoria as CategoriaRecurso) || "OTRO",
        url,
        disciplina: (disciplina as DisciplinaCurso) || null,
        esPublico: esPublico !== false,
        creadoPor: session.user.id,
      },
    })

    return NextResponse.json({ recurso }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
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

    const { id } = await request.json()
    await prisma.recurso.update({ where: { id }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
