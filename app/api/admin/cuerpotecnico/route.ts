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
        prisma.cuerpoTecnico.count({ where: { activo: true } }),
        prisma.cuerpoTecnico.count({ where: { activo: true, estadoHabilitacion: "HABILITADO" } }),
        prisma.cuerpoTecnico.count({ where: { activo: true, estadoHabilitacion: "PENDIENTE" } }),
        prisma.cuerpoTecnico.count({ where: { activo: true, pagoVerificado: false } }),
      ])
      return NextResponse.json({ total, habilitados, pendientes, pendientesPago })
    }

    const buscar = searchParams.get("buscar")
    const limite = parseInt(searchParams.get("limite") || "100")
    const eliminados = searchParams.get("eliminados") === "true"

    const where: Record<string, unknown> = { activo: !eliminados }
    if (estado && !eliminados) where.estadoHabilitacion = estado
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: "insensitive" } },
        { apellido: { contains: buscar, mode: "insensitive" } },
        { email: { contains: buscar, mode: "insensitive" } },
      ]
    }

    const miembros = await prisma.cuerpoTecnico.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limite,
    })

    return NextResponse.json({ miembros })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
