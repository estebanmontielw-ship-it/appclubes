import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
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

    const envStatus = {
      propertyId: Boolean(process.env.GA4_PROPERTY_ID),
      clientEmail: Boolean(process.env.GA4_CLIENT_EMAIL),
      privateKey: Boolean(process.env.GA4_PRIVATE_KEY),
    }

    if (!isGa4Configured()) {
      return NextResponse.json({
        configured: false,
        views: {},
        totalViews: 0,
        reason: "Falta alguna variable de entorno",
        envStatus,
      })
    }

    const { searchParams } = new URL(request.url)
    const daysBack = Math.min(parseInt(searchParams.get("days") ?? "90") || 90, 365)

    try {
      const views = await getNoticiasViews(daysBack)
      const totalViews = Object.values(views).reduce((a, b) => a + b, 0)
      return NextResponse.json({ configured: true, views, totalViews, daysBack })
    } catch (ga4Error: any) {
      return NextResponse.json({
        configured: false,
        views: {},
        totalViews: 0,
        reason: ga4Error?.message ?? "Error llamando a GA4",
        envStatus,
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Error" }, { status: 500 })
  }
}
