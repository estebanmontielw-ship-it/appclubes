import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

// PATCH — editar o marcar como pagado
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    // Verificar que el registro pertenece al usuario
    const existing = await prisma.honorarioPropio.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    if (existing.usuarioId !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()

    // Acción rápida: solo cambiar estado
    if (body.accion === "marcar_pagado") {
      const updated = await prisma.honorarioPropio.update({
        where: { id: params.id },
        data: { estado: "PAGADO", pagadoEn: new Date() },
      })
      return NextResponse.json({ registro: { ...updated, monto: Number(updated.monto) } })
    }

    if (body.accion === "marcar_pendiente") {
      const updated = await prisma.honorarioPropio.update({
        where: { id: params.id },
        data: { estado: "PENDIENTE", pagadoEn: null },
      })
      return NextResponse.json({ registro: { ...updated, monto: Number(updated.monto) } })
    }

    // Edición completa
    const { fecha, rama, categoria, equipoA, equipoB, rol, fase, faseNombre, montoSugerido, monto, estado, notas } = body
    if (!fecha || !rama || !categoria || !equipoA || !equipoB || !rol || !monto) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const updated = await prisma.honorarioPropio.update({
      where: { id: params.id },
      data: {
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
        pagadoEn: estado === "PAGADO" ? (existing.pagadoEn ?? new Date()) : null,
        notas: notas?.trim() || null,
      },
    })

    return NextResponse.json({
      registro: { ...updated, monto: Number(updated.monto), montoSugerido: updated.montoSugerido ? Number(updated.montoSugerido) : null },
    })
  } catch (error) {
    return handleApiError(error, { context: "PATCH /api/oficiales/honorarios-propios/[id]" })
  }
}

// DELETE — eliminar registro
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const existing = await prisma.honorarioPropio.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    if (existing.usuarioId !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    await prisma.honorarioPropio.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, { context: "DELETE /api/oficiales/honorarios-propios/[id]" })
  }
}
