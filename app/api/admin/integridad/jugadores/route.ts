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

/** GET — lista todos los jugadores tier (con filtros). */
export async function GET(request: Request) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const tier = url.searchParams.get("tier")
    const club = url.searchParams.get("club")
    const buscar = url.searchParams.get("buscar")?.trim()
    const incluirInactivos = url.searchParams.get("incluirInactivos") === "1"

    const where: Prisma.IntegridadJugadorTierWhereInput = {}
    if (!incluirInactivos) where.activo = true
    if (tier && TIERS_VALIDOS.includes(tier as IntegridadTier)) {
      where.tier = tier as IntegridadTier
    }
    if (club) where.club = club
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: "insensitive" } },
        { club: { contains: buscar, mode: "insensitive" } },
        { notas: { contains: buscar, mode: "insensitive" } },
      ]
    }

    const jugadores = await prisma.integridadJugadorTier.findMany({
      where,
      orderBy: [{ tier: "asc" }, { club: "asc" }, { nombre: "asc" }],
    })

    return NextResponse.json({ jugadores })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/integridad/jugadores" })
  }
}

/** POST — crea un jugador tier. */
export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const body = await request.json()
    const { nombre, club, clubSigla, numero, tier, notas } = body

    if (typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json({ error: "nombre requerido" }, { status: 400 })
    }
    if (typeof club !== "string" || !club.trim()) {
      return NextResponse.json({ error: "club requerido" }, { status: 400 })
    }
    if (tier && !TIERS_VALIDOS.includes(tier)) {
      return NextResponse.json({ error: "tier inválido" }, { status: 400 })
    }

    const jugador = await prisma.integridadJugadorTier.create({
      data: {
        nombre: nombre.trim(),
        nombreNorm: normalizeName(nombre),
        club: club.trim(),
        clubSigla: typeof clubSigla === "string" ? clubSigla.trim().toUpperCase() : null,
        numero: typeof numero === "number" ? numero : null,
        tier: (tier as IntegridadTier) ?? "TIER_2",
        notas: typeof notas === "string" ? notas.slice(0, 2000) : null,
        creadoPor: auth.user!.id,
      },
    })

    await prisma.integridadAuditLog.create({
      data: {
        accion: "crear_jugador",
        userId: auth.user!.id,
        userEmail: auth.user!.email,
        detalles: { jugadorId: jugador.id, nombre: jugador.nombre, club: jugador.club } as any,
      },
    })

    return NextResponse.json({ jugador }, { status: 201 })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/admin/integridad/jugadores" })
  }
}
