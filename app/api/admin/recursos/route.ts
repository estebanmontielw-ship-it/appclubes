import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireRole, isAuthError } from "@/lib/api-auth"
import type { TipoRecurso, CategoriaRecurso, DisciplinaCurso } from "@prisma/client"
import { handleApiError } from "@/lib/api-errors"

export async function GET() {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const recursos = await prisma.recurso.findMany({
      where: { activo: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ recursos })
  } catch (error) {
    return handleApiError(error, { context: "admin/recursos" })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

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
        creadoPor: auth.user.id,
      },
    })

    return NextResponse.json({ recurso }, { status: 201 })
  } catch (error) {
    return handleApiError(error, { context: "admin/recursos" })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const { id } = await request.json()
    await prisma.recurso.update({ where: { id }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, { context: "admin/recursos" })
  }
}
