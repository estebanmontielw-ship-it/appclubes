import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { EstadoVerificacion } from "@prisma/client"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") as EstadoVerificacion | null
    const buscar = searchParams.get("buscar")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (estado) {
      where.estadoVerificacion = estado
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: "insensitive" } },
        { apellido: { contains: buscar, mode: "insensitive" } },
        { cedula: { contains: buscar } },
      ]
    }

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        include: { roles: true },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.usuario.count({ where }),
    ])

    return NextResponse.json({ usuarios, total, page, limit })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
