import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const designaciones = await prisma.designacion.findMany({
      where: { usuarioId: session.user.id },
      include: {
        partido: true,
      },
      orderBy: { partido: { fecha: "desc" } },
    })

    return NextResponse.json({ designaciones })
  } catch (error) {
    return handleApiError(error, { context: "mis-partidos" })
  }
}
