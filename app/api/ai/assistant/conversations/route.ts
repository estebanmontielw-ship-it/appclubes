import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

async function getAdminId() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null
  if (!session?.user) return null
  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
  })
  return adminRoles.length > 0 ? session.user.id : null
}

// GET: list conversations
export async function GET() {
  try {
    const userId = await getAdminId()
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const conversaciones = await prisma.conversacionBot.findMany({
      where: { usuarioId: userId, activa: true },
      orderBy: { updatedAt: "desc" },
      include: { mensajes: { orderBy: { createdAt: "desc" }, take: 1, select: { contenido: true, createdAt: true } } },
    })

    return NextResponse.json({ conversaciones })
  } catch (error) {
    return handleApiError(error, { context: "ai/assistant/conversations" })
  }
}

// POST: create new conversation
export async function POST(request: Request) {
  try {
    const userId = await getAdminId()
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json().catch(() => ({}))

    const conversacion = await prisma.conversacionBot.create({
      data: {
        usuarioId: userId,
        titulo: body.titulo || "Nueva conversación",
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ conversacion }, { status: 201 })
  } catch (error) {
    return handleApiError(error, { context: "ai/assistant/conversations" })
  }
}
