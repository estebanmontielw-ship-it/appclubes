import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const honorarios = await prisma.honorario.findMany({
      where: { usuarioId: user.id },
      include: {
        partido: { select: { equipoLocal: true, equipoVisit: true, fecha: true, categoria: true } },
        designacion: { select: { rol: true, esManual: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const [pendAggregate, pagadoAggregate, cobradoEsteAnio] = await Promise.all([
      prisma.honorario.aggregate({
        where: { usuarioId: user.id, estado: "PENDIENTE" },
        _sum: { montoTotal: true },
      }),
      prisma.honorario.aggregate({
        where: { usuarioId: user.id, estado: "PAGADO" },
        _sum: { montoTotal: true },
      }),
      prisma.honorario.aggregate({
        where: {
          usuarioId: user.id,
          cobradoEn: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
        _sum: { montoTotal: true },
      }),
    ])

    return NextResponse.json({
      honorarios,
      totalPendiente: pendAggregate._sum.montoTotal || 0,
      totalPagado: pagadoAggregate._sum.montoTotal || 0,
      cobradoEsteAnio: cobradoEsteAnio._sum.montoTotal || 0,
    })
  } catch (error) {
    return handleApiError(error, { context: "mis-honorarios" })
  }
}
