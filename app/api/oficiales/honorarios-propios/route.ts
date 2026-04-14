import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// GET — listar todos los honorarios propios del usuario + stats
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const [registros, aggPendiente, aggPagado] = await Promise.all([
      prisma.honorarioPropio.findMany({
        where: { usuarioId: user.id },
        orderBy: { fecha: "desc" },
      }),
      prisma.honorarioPropio.aggregate({
        where: { usuarioId: user.id, estado: "PENDIENTE" },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.honorarioPropio.aggregate({
        where: { usuarioId: user.id, estado: "PAGADO" },
        _sum: { monto: true },
        _count: true,
      }),
    ])

    const totalPendiente = Number(aggPendiente._sum.monto ?? 0)
    const totalPagado = Number(aggPagado._sum.monto ?? 0)

    return NextResponse.json({
      registros: registros.map((r) => ({
        ...r,
        monto: Number(r.monto),
        montoSugerido: r.montoSugerido ? Number(r.montoSugerido) : null,
      })),
      stats: {
        totalAcumulado: totalPendiente + totalPagado,
        totalPendiente,
        totalPagado,
        countPendiente: aggPendiente._count,
        countPagado: aggPagado._count,
        countTotal: aggPendiente._count + aggPagado._count,
      },
    })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/oficiales/honorarios-propios" })
  }
}

// POST — crear nuevo registro
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json()
    const { fecha, rama, categoria, equipoA, equipoB, rol, fase, faseNombre, montoSugerido, monto, estado, notas } = body

    if (!fecha || !rama || !categoria || !equipoA || !equipoB || !rol || !monto) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }
    if (Number(monto) <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 })
    }

    const registro = await prisma.honorarioPropio.create({
      data: {
        usuarioId: user.id,
        fecha: new Date(fecha),
        rama,
        categoria,
        equipoA: equipoA.trim(),
        equipoB: equipoB.trim(),
        rol,
        fase: fase || null,
        faseNombre: faseNombre || null,
        montoSugerido: montoSugerido ? Number(montoSugerido) : null,
        monto: Number(monto),
        estado: estado || "PENDIENTE",
        pagadoEn: estado === "PAGADO" ? new Date() : null,
        notas: notas?.trim() || null,
      },
    })

    return NextResponse.json({
      registro: { ...registro, monto: Number(registro.monto), montoSugerido: registro.montoSugerido ? Number(registro.montoSugerido) : null },
    })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/oficiales/honorarios-propios" })
  }
}
