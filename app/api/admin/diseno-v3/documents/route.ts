import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// GET /api/admin/diseno-v3/documents?liga=lnb&limit=50
// Lista los documentos del usuario autenticado (más recientes primero).
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const liga = req.nextUrl.searchParams.get("liga")
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50", 10) || 50, 200)

    const docs = await prisma.disenoV3Document.findMany({
      where: {
        ownerId: auth.user.id,
        ...(liga ? { liga } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        nombre: true,
        liga: true,
        template: true,
        format: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ documents: docs })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/diseno-v3/documents" })
  }
}

// POST /api/admin/diseno-v3/documents
// Crea un documento nuevo.
// Body: { nombre, liga, template?, format?, canvasJson, thumbnailUrl? }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const nombre = String(body.nombre ?? "Diseño sin título").slice(0, 200)
    const liga = String(body.liga ?? "lnb")
    const template = String(body.template ?? "blank")
    const format = String(body.format ?? "feed")
    const canvasJson = body.canvasJson
    const thumbnailUrl = body.thumbnailUrl ? String(body.thumbnailUrl) : null

    if (!canvasJson || typeof canvasJson !== "object") {
      return NextResponse.json({ error: "canvasJson requerido" }, { status: 400 })
    }

    const doc = await prisma.disenoV3Document.create({
      data: {
        ownerId: auth.user.id,
        nombre,
        liga,
        template,
        format,
        canvasJson,
        thumbnailUrl,
      },
    })

    return NextResponse.json({ document: doc })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/admin/diseno-v3/documents" })
  }
}
