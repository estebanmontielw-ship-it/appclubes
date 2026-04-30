import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"
import { normalizeName } from "@/lib/integridad"
import type { IntegridadTier, Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

const TIERS_VALIDOS: IntegridadTier[] = ["TIER_1", "TIER_2", "TIER_3"]

async function requireSuperAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
  })
  if (adminRoles.length === 0) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }
  return { user }
}

/** PATCH — actualiza un jugador tier. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const body = await request.json()
    const data: Prisma.IntegridadJugadorTierUpdateInput = {}

    if (typeof body.nombre === "string" && body.nombre.trim()) {
      data.nombre = body.nombre.trim()
      data.nombreNorm = normalizeName(body.nombre)
    }
    if (typeof body.club === "string" && body.club.trim()) {
      data.club = body.club.trim()
    }
    if (typeof body.clubSigla === "string") {
      data.clubSigla = body.clubSigla.trim().toUpperCase() || null
    }
    if (body.numero === null || typeof body.numero === "number") {
      data.numero = body.numero
    }
    if (body.tier && TIERS_VALIDOS.includes(body.tier)) {
      data.tier = body.tier
    } else if (body.tier !== undefined) {
      return NextResponse.json({ error: "tier inválido" }, { status: 400 })
    }
    if (typeof body.notas === "string") {
      data.notas = body.notas.slice(0, 2000)
    } else if (body.notas === null) {
      data.notas = null
    }
    if (typeof body.activo === "boolean") {
      data.activo = body.activo
    }

    const jugador = await prisma.integridadJugadorTier.update({
      where: { id: params.id },
      data,
    })

    await prisma.integridadAuditLog.create({
      data: {
        accion: "editar_jugador",
        userId: auth.user!.id,
        userEmail: auth.user!.email,
        detalles: { jugadorId: jugador.id, cambios: body } as any,
      },
    })

    return NextResponse.json({ jugador })
  } catch (error) {
    return handleApiError(error, { context: "PATCH /api/admin/integridad/jugadores/[id]" })
  }
}

/** DELETE — borra un jugador tier (hard delete). */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const jugador = await prisma.integridadJugadorTier.delete({
      where: { id: params.id },
    })

    await prisma.integridadAuditLog.create({
      data: {
        accion: "borrar_jugador",
        userId: auth.user!.id,
        userEmail: auth.user!.email,
        detalles: { jugadorId: jugador.id, nombre: jugador.nombre, club: jugador.club } as any,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, { context: "DELETE /api/admin/integridad/jugadores/[id]" })
  }
}
