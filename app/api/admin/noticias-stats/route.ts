import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"
import { getNoticiasViews, isGa4Configured } from "@/lib/ga4"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (!isGa4Configured()) {
      return NextResponse.json({ configured: false, views: {}, totalViews: 0 })
    }

    const { searchParams } = new URL(request.url)
    const daysBack = Math.min(parseInt(searchParams.get("days") ?? "90") || 90, 365)

    const views = await getNoticiasViews(daysBack)
    const totalViews = Object.values(views).reduce((a, b) => a + b, 0)

    return NextResponse.json({ configured: true, views, totalViews, daysBack })
  } catch (error) {
    return handleApiError(error, { context: "admin/noticias-stats" })
  }
}
