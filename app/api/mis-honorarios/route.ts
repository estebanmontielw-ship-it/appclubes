import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const honorarios = await prisma.honorario.findMany({
      where: { usuarioId: session.user.id },
      include: {
        partido: { select: { equipoLocal: true, equipoVisit: true, fecha: true, categoria: true } },
        designacion: { select: { rol: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const totalPendiente = await prisma.honorario.aggregate({
      where: { usuarioId: session.user.id, estado: "PENDIENTE" },
      _sum: { monto: true },
    })

    const totalPagado = await prisma.honorario.aggregate({
      where: { usuarioId: session.user.id, estado: "PAGADO" },
      _sum: { monto: true },
    })

    return NextResponse.json({
      honorarios,
      totalPendiente: totalPendiente._sum.monto || 0,
      totalPagado: totalPagado._sum.monto || 0,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
