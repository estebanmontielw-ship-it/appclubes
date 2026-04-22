import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

const VALID_LIGAS = ["lnb", "lnbf", "u22m", "u22f"] as const
type Liga = (typeof VALID_LIGAS)[number]

function validLiga(v: string | null): v is Liga {
  return v !== null && VALID_LIGAS.includes(v as Liga)
}

// GET /api/admin/diseno-config?liga=lnb
// Devuelve la config para esa liga. Si no existe, devuelve defaults.
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const liga = req.nextUrl.searchParams.get("liga")
    if (!validLiga(liga)) {
      return NextResponse.json({ error: "Liga inválida" }, { status: 400 })
    }

    const config = await prisma.disenoConfig.findUnique({ where: { liga } })

    // Si no hay config, devolvemos un objeto vacío → el cliente usa sus
    // defaults. No creamos la fila hasta que el user cambie algo.
    return NextResponse.json({ config: config ?? null })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/diseno-config" })
  }
}

// PATCH /api/admin/diseno-config?liga=lnb
// Upsert: guarda los campos enviados en el body. Los que no vienen quedan
// como estaban (no se pisan con defaults).
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const liga = req.nextUrl.searchParams.get("liga")
    if (!validLiga(liga)) {
      return NextResponse.json({ error: "Liga inválida" }, { status: 400 })
    }

    const body = await req.json()

    // Solo aceptamos campos conocidos para no dejar que el cliente
    // inyecte columnas raras.
    const allowed: Record<string, unknown> = {}
    const stringFields = ["logoUrl", "theme", "bgImageUrl", "bgFit", "textureUrl", "sponsorBg", "cardStyle", "textColor", "layout"] as const
    const intFields = ["logoScale", "textureOpacity", "titleSize", "subtitleSize", "titleWeight"] as const
    const jsonFields = ["sponsors", "sponsorScales"] as const

    for (const f of stringFields) {
      if (f in body) allowed[f] = body[f] === null ? null : String(body[f])
    }
    for (const f of intFields) {
      if (f in body) {
        const n = parseInt(body[f], 10)
        if (Number.isFinite(n)) allowed[f] = n
      }
    }
    for (const f of jsonFields) {
      if (f in body && Array.isArray(body[f])) allowed[f] = body[f]
    }

    const saved = await prisma.disenoConfig.upsert({
      where: { liga },
      create: { liga, ...allowed },
      update: allowed,
    })

    return NextResponse.json({ config: saved })
  } catch (error) {
    return handleApiError(error, { context: "PATCH /api/admin/diseno-config" })
  }
}
