import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Check admin role
    const adminRoles = await prisma.usuarioRol.findMany({
      where: {
        usuarioId: session.user.id,
        rol: { in: ["SUPER_ADMIN", "INSTRUCTOR"] },
      },
    })

    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const [totalUsuarios, verificados, pendientes, pagosPendientes] =
      await Promise.all([
        prisma.usuario.count(),
        prisma.usuario.count({ where: { estadoVerificacion: "VERIFICADO" } }),
        prisma.usuario.count({ where: { estadoVerificacion: "PENDIENTE" } }),
        prisma.pago.count({ where: { estado: "PENDIENTE_REVISION" } }),
      ])

    return NextResponse.json({
      totalUsuarios,
      verificados,
      pendientes,
      pagosPendientes,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
