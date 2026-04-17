import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// GET - Aggregated HonorarioPropio stats per official (SUPER_ADMIN only)
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su } } = await supabase.auth.getUser()
    if (!_su) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRole = await prisma.usuarioRol.findFirst({
      where: { usuarioId: _su.id, rol: "SUPER_ADMIN" },
    })
    if (!adminRole) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Detail view — all records for one official
    if (userId) {
      const registros = await prisma.honorarioPropio.findMany({
        where: { usuarioId: userId },
        include: { usuario: { select: { nombre: true, apellido: true, email: true } } },
        orderBy: { fecha: "desc" },
      })
      return NextResponse.json({ registros })
    }

    // Summary view — one row per official
    const resumen = await prisma.honorarioPropio.groupBy({
      by: ["usuarioId"],
      _count: { id: true },
      _sum: { monto: true },
    })

    if (resumen.length === 0) return NextResponse.json({ oficiales: [] })

    const userIds = resumen.map(r => r.usuarioId)
    const [usuarios, pendientes, pagados] = await Promise.all([
      prisma.usuario.findMany({
        where: { id: { in: userIds } },
        select: { id: true, nombre: true, apellido: true, email: true, fotoCarnetUrl: true },
      }),
      prisma.honorarioPropio.groupBy({
        by: ["usuarioId"],
        where: { usuarioId: { in: userIds }, estado: "PENDIENTE" },
        _sum: { monto: true },
        _count: { id: true },
      }),
      prisma.honorarioPropio.groupBy({
        by: ["usuarioId"],
        where: { usuarioId: { in: userIds }, estado: "PAGADO" },
        _sum: { monto: true },
        _count: { id: true },
      }),
    ])

    const userMap = new Map(usuarios.map(u => [u.id, u]))
    const pendienteMap = new Map(pendientes.map(p => [p.usuarioId, p]))
    const pagadoMap = new Map(pagados.map(p => [p.usuarioId, p]))

    const oficiales = resumen
      .map(r => {
        const usuario = userMap.get(r.usuarioId)
        if (!usuario) return null
        return {
          usuarioId: r.usuarioId,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          fotoCarnetUrl: usuario.fotoCarnetUrl ?? null,
          totalPartidos: r._count.id,
          totalGeneral: Number(r._sum.monto ?? 0),
          totalPendiente: Number(pendienteMap.get(r.usuarioId)?._sum.monto ?? 0),
          totalPagado: Number(pagadoMap.get(r.usuarioId)?._sum.monto ?? 0),
          partidosPendientes: pendienteMap.get(r.usuarioId)?._count.id ?? 0,
          partidosPagados: pagadoMap.get(r.usuarioId)?._count.id ?? 0,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b!.totalGeneral - a!.totalGeneral)

    const totales = {
      totalGeneral: oficiales.reduce((s, o) => s + o!.totalGeneral, 0),
      totalPendiente: oficiales.reduce((s, o) => s + o!.totalPendiente, 0),
      totalPagado: oficiales.reduce((s, o) => s + o!.totalPagado, 0),
      totalPartidos: oficiales.reduce((s, o) => s + o!.totalPartidos, 0),
      totalOficiales: oficiales.length,
    }

    return NextResponse.json({ oficiales, totales })
  } catch (error) {
    return handleApiError(error, { context: "admin/honorarios-propios" })
  }
}
