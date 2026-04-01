import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

async function getAdminId() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
  })
  return adminRoles.length > 0 ? session.user.id : null
}

// GET: get conversation with messages
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAdminId()
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const conversacion = await prisma.conversacionBot.findFirst({
      where: { id: params.id, usuarioId: userId },
      include: { mensajes: { orderBy: { createdAt: "asc" } } },
    })

    if (!conversacion) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    return NextResponse.json({ conversacion })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// PUT: update title or archive
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAdminId()
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()
    const conversacion = await prisma.conversacionBot.updateMany({
      where: { id: params.id, usuarioId: userId },
      data: {
        ...(body.titulo !== undefined && { titulo: body.titulo }),
        ...(body.activa !== undefined && { activa: body.activa }),
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAdminId()
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    await prisma.conversacionBot.deleteMany({ where: { id: params.id, usuarioId: userId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
