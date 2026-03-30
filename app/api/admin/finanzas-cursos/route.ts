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

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    if (tipo === "detalle") {
      // Detailed list of all payments
      const pagos = await prisma.pago.findMany({
        include: {
          inscripcion: {
            include: {
              usuario: { select: { nombre: true, apellido: true, email: true } },
              curso: { select: { nombre: true, disciplina: true, precio: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json({ pagos })
    }

    if (tipo === "por-curso") {
      // Revenue per course
      const cursos = await prisma.curso.findMany({
        include: {
          _count: { select: { inscripciones: true } },
          inscripciones: {
            include: {
              pagos: {
                where: { estado: "CONFIRMADO" },
                select: { monto: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      const cursosConIngresos = cursos.map((curso) => {
        const totalIngresos = curso.inscripciones.reduce(
          (sum, insc) =>
            sum + insc.pagos.reduce((s, p) => s + Number(p.monto), 0),
          0
        )
        const inscriptosActivos = curso.inscripciones.filter(
          (i) => i.estado === "ACTIVO" || i.estado === "COMPLETADO"
        ).length
        const pendientesPago = curso.inscripciones.filter(
          (i) => i.estado === "PENDIENTE_PAGO"
        ).length

        return {
          id: curso.id,
          nombre: curso.nombre,
          disciplina: curso.disciplina,
          precio: Number(curso.precio),
          esGratuito: curso.esGratuito,
          estado: curso.estado,
          totalInscriptos: curso._count.inscripciones,
          inscriptosActivos,
          pendientesPago,
          totalIngresos,
        }
      })

      return NextResponse.json({ cursos: cursosConIngresos })
    }

    // Dashboard stats
    const [
      totalIngresosCursos,
      pagosPendientes,
      pagosConfirmados,
      totalInscripciones,
      inscripcionesActivas,
      cursosActivos,
    ] = await Promise.all([
      prisma.pago.aggregate({
        where: { estado: "CONFIRMADO" },
        _sum: { monto: true },
      }),
      prisma.pago.count({ where: { estado: "PENDIENTE_REVISION" } }),
      prisma.pago.count({ where: { estado: "CONFIRMADO" } }),
      prisma.inscripcion.count(),
      prisma.inscripcion.count({ where: { estado: "ACTIVO" } }),
      prisma.curso.count({ where: { estado: "ACTIVO" } }),
    ])

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const pagosRecientes = await prisma.pago.findMany({
      where: { estado: "CONFIRMADO", createdAt: { gte: sixMonthsAgo } },
      select: { monto: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    const ingresosPorMes: Record<string, number> = {}
    pagosRecientes.forEach((p) => {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`
      ingresosPorMes[key] = (ingresosPorMes[key] || 0) + Number(p.monto)
    })

    return NextResponse.json({
      totalIngresosCursos: totalIngresosCursos._sum.monto || 0,
      pagosPendientes,
      pagosConfirmados,
      totalInscripciones,
      inscripcionesActivas,
      cursosActivos,
      ingresosPorMes,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
