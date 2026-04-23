import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// POST /api/admin/diseno-v3/documents/[id]/duplicate
// Crea una copia exacta del documento.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const src = await prisma.disenoV3Document.findUnique({ where: { id: params.id } })
    if (!src || src.ownerId !== auth.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const doc = await prisma.disenoV3Document.create({
      data: {
        ownerId: auth.user.id,
        nombre: `${src.nombre} (copia)`.slice(0, 200),
        liga: src.liga,
        template: src.template,
        format: src.format,
        canvasJson: src.canvasJson as object,
        thumbnailUrl: src.thumbnailUrl,
      },
    })

    return NextResponse.json({ document: doc })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/admin/diseno-v3/documents/[id]/duplicate" })
  }
}
