import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// POST: Delete all fake/invalid push tokens from the DB (SUPER_ADMIN only)
export async function POST(_req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const rol = await prisma.usuarioRol.findFirst({
      where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
    })
    if (!rol) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { count } = await prisma.pushToken.deleteMany({
      where: { token: { startsWith: "ios-accepted-" } },
    })

    return NextResponse.json({ deleted: count })
  } catch (error) {
    return handleApiError(error, { context: "push/cleanup" })
  }
}
