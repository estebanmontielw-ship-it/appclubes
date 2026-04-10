import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

async function requireAdmin(request?: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const rol = await prisma.usuarioRol.findFirst({ where: { usuarioId: user.id, rol: "SUPER_ADMIN" } })
  if (!rol) return null
  return user
}

export async function GET(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    if (tipo === "aranceles") {
      const aranceles = await prisma.arancel.findMany({
        where: { activo: true },
        orderBy: [{ categoria: "asc" }, { rol: "asc" }],
      })
      return NextResponse.json({ aranceles })
    }

    if (tipo === "honorarios") {
      const mes = searchParams.get("mes")       // "2026-04"
      const cat = searchParams.get("categoria")
      const q   = searchParams.get("q")         // nombre del oficial
      const est = searchParams.get("estado")    // "PENDIENTE" | "PAGADO"

      const where: any = {}
      if (est === "PENDIENTE" || est === "PAGADO") where.estado = est
      if (cat) where.partido = { categoria: cat }
      if (mes) {
        const [y, m] = mes.split("-").map(Number)
        const from = new Date(y, m - 1, 1)
        const to   = new Date(y, m, 1)
        where.createdAt = { gte: from, lt: to }
      }
      if (q) {
        where.usuario = {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { apellido: { contains: q, mode: "insensitive" } },
          ],
        }
      }

      const honorarios = await prisma.honorario.findMany({
        where,
        include: {
          usuario: { select: { nombre: true, apellido: true, esEmpresa: true } },
          partido: { select: { equipoLocal: true, equipoVisit: true, fecha: true, categoria: true } },
          designacion: { select: { rol: true, esManual: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      })
      return NextResponse.json({ honorarios })
    }

    if (tipo === "stats_detail") {
      // breakdown por mes (últimos 6) y por categoría
      const honorarios = await prisma.honorario.findMany({
        include: { partido: { select: { categoria: true, fecha: true } } },
        orderBy: { createdAt: "desc" },
      })

      const byMes: Record<string, { pendiente: number; pagado: number; count: number }> = {}
      const byCat: Record<string, { pendiente: number; pagado: number; count: number }> = {}

      for (const h of honorarios) {
        const mes = new Date(h.createdAt).toISOString().slice(0, 7)
        const cat = h.partido.categoria
        const total = Number(h.montoTotal)

        if (!byMes[mes]) byMes[mes] = { pendiente: 0, pagado: 0, count: 0 }
        if (!byCat[cat])  byCat[cat]  = { pendiente: 0, pagado: 0, count: 0 }

        if (h.estado === "PENDIENTE") {
          byMes[mes].pendiente += total
          byCat[cat].pendiente += total
        } else {
          byMes[mes].pagado += total
          byCat[cat].pagado += total
        }
        byMes[mes].count++
        byCat[cat].count++
      }

      return NextResponse.json({ byMes, byCat })
    }

    // Default: stats summary
    const now = new Date()
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalPendiente, totalPagado, honorariosCount, pagadoEsteMes] = await Promise.all([
      prisma.honorario.aggregate({ where: { estado: "PENDIENTE" }, _sum: { montoTotal: true } }),
      prisma.honorario.aggregate({ where: { estado: "PAGADO" }, _sum: { montoTotal: true } }),
      prisma.honorario.count(),
      prisma.honorario.aggregate({ where: { estado: "PAGADO", pagadoEn: { gte: mesInicio } }, _sum: { montoTotal: true } }),
    ])

    return NextResponse.json({
      totalPendiente: totalPendiente._sum.montoTotal || 0,
      totalPagado: totalPagado._sum.montoTotal || 0,
      honorariosCount,
      pagadoEsteMes: pagadoEsteMes._sum.montoTotal || 0,
    })
  } catch (error) {
    return handleApiError(error, { context: "admin/finanzas GET" })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()

    if (body.accion === "crear_arancel") {
      const arancel = await prisma.arancel.upsert({
        where: { categoria_rol: { categoria: body.categoria, rol: body.rol } },
        create: { categoria: body.categoria, rol: body.rol, monto: body.monto, descripcion: body.descripcion || null },
        update: { monto: body.monto, descripcion: body.descripcion || null, activo: true },
      })
      return NextResponse.json({ arancel })
    }

    if (body.accion === "editar_arancel") {
      const arancel = await prisma.arancel.update({
        where: { id: body.id },
        data: { monto: body.monto, descripcion: body.descripcion ?? undefined },
      })
      return NextResponse.json({ arancel })
    }

    if (body.accion === "eliminar_arancel") {
      await prisma.arancel.update({ where: { id: body.id }, data: { activo: false } })
      return NextResponse.json({ ok: true })
    }

    if (body.accion === "importar_aranceles") {
      // body.aranceles = [{ categoria, rol, monto }]
      const items: { categoria: string; rol: string; monto: number }[] = body.aranceles || []
      let count = 0
      for (const item of items) {
        try {
          await prisma.arancel.upsert({
            where: { categoria_rol: { categoria: item.categoria as any, rol: item.rol as any } },
            create: { categoria: item.categoria as any, rol: item.rol as any, monto: item.monto },
            update: { monto: item.monto, activo: true },
          })
          count++
        } catch {}
      }
      return NextResponse.json({ importados: count })
    }

    if (body.accion === "marcar_pagado") {
      const h = await prisma.honorario.findUnique({ where: { id: body.honorarioId } })
      if (!h) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

      const aplicaIva = body.aplicaIva ?? h.aplicaIva
      const montoNeto = Number(h.monto)
      const montoIva  = aplicaIva ? montoNeto * 0.10 : 0
      const montoTotal = montoNeto + montoIva

      const honorario = await prisma.honorario.update({
        where: { id: body.honorarioId },
        data: {
          estado: "PAGADO",
          pagadoEn: new Date(),
          aplicaIva,
          montoIva: montoIva || null,
          montoTotal,
          comprobante: body.comprobante || null,
          notas: body.notas || null,
        },
      })
      return NextResponse.json({ honorario })
    }

    if (body.accion === "generar_honorarios") {
      const designaciones = await prisma.designacion.findMany({
        where: { partidoId: body.partidoId, honorario: null },
        include: { partido: true, usuario: true },
      })
      let generated = 0
      for (const desig of designaciones) {
        const arancel = await prisma.arancel.findUnique({
          where: { categoria_rol: { categoria: desig.partido.categoria, rol: desig.rol } },
        })
        if (!arancel) continue
        const aplicaIva = desig.usuario.esEmpresa
        const montoNeto = Number(arancel.monto)
        const montoIva  = aplicaIva ? montoNeto * 0.10 : 0
        await prisma.honorario.create({
          data: {
            designacionId: desig.id,
            partidoId: desig.partidoId,
            usuarioId: desig.usuarioId,
            monto: montoNeto,
            aplicaIva,
            montoIva: montoIva || null,
            montoTotal: montoNeto + montoIva,
          },
        })
        generated++
      }
      return NextResponse.json({ generated })
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error) {
    return handleApiError(error, { context: "admin/finanzas POST" })
  }
}
