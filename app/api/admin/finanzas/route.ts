import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

// GET - Dashboard financiero stats + honorarios
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") // "aranceles" | "honorarios" | "stats"

    if (tipo === "aranceles") {
      const aranceles = await prisma.arancel.findMany({
        where: { activo: true },
        orderBy: [{ categoria: "asc" }, { rol: "asc" }],
      })
      return NextResponse.json({ aranceles })
    }

    if (tipo === "honorarios") {
      const honorarios = await prisma.honorario.findMany({
        include: {
          usuario: { select: { nombre: true, apellido: true } },
          partido: { select: { equipoLocal: true, equipoVisit: true, fecha: true } },
          designacion: { select: { rol: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json({ honorarios })
    }

    // Stats
    const [totalPendiente, totalPagado, honorariosCount] = await Promise.all([
      prisma.honorario.aggregate({ where: { estado: "PENDIENTE" }, _sum: { monto: true } }),
      prisma.honorario.aggregate({ where: { estado: "PAGADO" }, _sum: { monto: true } }),
      prisma.honorario.count(),
    ])

    return NextResponse.json({
      totalPendiente: totalPendiente._sum.monto || 0,
      totalPagado: totalPagado._sum.monto || 0,
      honorariosCount,
    })
  } catch (error) {
    return handleApiError(error, { context: "admin/finanzas" })
  }
}

// POST - Create/update arancel or mark honorario as paid
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()

    if (body.accion === "crear_arancel") {
      const arancel = await prisma.arancel.upsert({
        where: { categoria_rol: { categoria: body.categoria, rol: body.rol } },
        create: { categoria: body.categoria, rol: body.rol, monto: body.monto, descripcion: body.descripcion || null },
        update: { monto: body.monto, descripcion: body.descripcion || null },
      })
      return NextResponse.json({ arancel })
    }

    if (body.accion === "marcar_pagado") {
      const honorario = await prisma.honorario.update({
        where: { id: body.honorarioId },
        data: { estado: "PAGADO", pagadoEn: new Date(), comprobante: body.comprobante || null, notas: body.notas || null },
      })
      return NextResponse.json({ honorario })
    }

    if (body.accion === "generar_honorarios") {
      // Generate honorarios for all confirmed designations of a partido
      const designaciones = await prisma.designacion.findMany({
        where: { partidoId: body.partidoId, estado: "PENDIENTE", honorario: null },
        include: { partido: true },
      })

      const results = []
      for (const desig of designaciones) {
        const arancel = await prisma.arancel.findUnique({
          where: { categoria_rol: { categoria: desig.partido.categoria, rol: desig.rol } },
        })
        if (arancel) {
          const honorario = await prisma.honorario.create({
            data: {
              designacionId: desig.id,
              partidoId: desig.partidoId,
              usuarioId: desig.usuarioId,
              monto: arancel.monto,
            },
          })
          results.push(honorario)
        }
      }
      return NextResponse.json({ generated: results.length })
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error) {
    return handleApiError(error, { context: "admin/finanzas" })
  }
}
