import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// GET /api/admin/diseno-v3/documents/[id] → documento completo con canvasJson
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const doc = await prisma.disenoV3Document.findUnique({ where: { id: params.id } })
    if (!doc || doc.ownerId !== auth.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    return NextResponse.json({ document: doc })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/diseno-v3/documents/[id]" })
  }
}

// PATCH /api/admin/diseno-v3/documents/[id]
// Body: { nombre?, liga?, template?, format?, canvasJson?, thumbnailUrl? }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const existing = await prisma.disenoV3Document.findUnique({ where: { id: params.id } })
    if (!existing || existing.ownerId !== auth.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}
    if ("nombre" in body) data.nombre = String(body.nombre).slice(0, 200)
    if ("liga" in body) data.liga = String(body.liga)
    if ("template" in body) data.template = String(body.template)
    if ("format" in body) data.format = String(body.format)
    if ("canvasJson" in body && body.canvasJson && typeof body.canvasJson === "object") {
      data.canvasJson = body.canvasJson
    }
    if ("thumbnailUrl" in body) {
      data.thumbnailUrl = body.thumbnailUrl ? String(body.thumbnailUrl) : null
    }

    const doc = await prisma.disenoV3Document.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ document: doc })
  } catch (error) {
    return handleApiError(error, { context: "PATCH /api/admin/diseno-v3/documents/[id]" })
  }
}

// DELETE /api/admin/diseno-v3/documents/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const existing = await prisma.disenoV3Document.findUnique({ where: { id: params.id } })
    if (!existing || existing.ownerId !== auth.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await prisma.disenoV3Document.delete({ where: { id: params.id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, { context: "DELETE /api/admin/diseno-v3/documents/[id]" })
  }
}
