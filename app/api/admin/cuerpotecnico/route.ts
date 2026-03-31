import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const tipo = searchParams.get("tipo")

    if (tipo === "stats") {
      const [total, habilitados, pendientes, pendientesPago] = await Promise.all([
        prisma.cuerpoTecnico.count(),
        prisma.cuerpoTecnico.count({ where: { estadoHabilitacion: "HABILITADO" } }),
        prisma.cuerpoTecnico.count({ where: { estadoHabilitacion: "PENDIENTE" } }),
        prisma.cuerpoTecnico.count({ where: { pagoVerificado: false } }),
      ])
      return NextResponse.json({ total, habilitados, pendientes, pendientesPago })
    }

    const where: Record<string, unknown> = {}
    if (estado) where.estadoHabilitacion = estado

    const miembros = await prisma.cuerpoTecnico.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ miembros })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
