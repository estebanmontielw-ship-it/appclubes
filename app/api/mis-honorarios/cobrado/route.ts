import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// POST: official marks an honorario as personally received/cobrado
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { honorarioId } = await request.json()
    if (!honorarioId) return NextResponse.json({ error: "honorarioId requerido" }, { status: 400 })

    // Ensure the honorario belongs to this user and is PAGADO
    const h = await prisma.honorario.findFirst({
      where: { id: honorarioId, usuarioId: user.id },
    })
    if (!h) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    if (h.estado !== "PAGADO") {
      return NextResponse.json({ error: "El honorario aún no fue marcado como pagado por el admin" }, { status: 400 })
    }

    const updated = await prisma.honorario.update({
      where: { id: honorarioId },
      data: { cobradoEn: h.cobradoEn ?? new Date() },
    })

    return NextResponse.json({ honorario: updated })
  } catch (error) {
    return handleApiError(error, { context: "mis-honorarios/cobrado" })
  }
}
