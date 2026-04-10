import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// PATCH /api/torneo3x3/jugadores/[id]
// No auth required — public form filled by delegates
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { fechaNac, nroCi, celular, camiseta } = body

    const jugador = await prisma.torneo3x3Jugador.update({
      where: { id: params.id },
      data: {
        fechaNac: fechaNac || undefined,
        nroCi: nroCi || undefined,
        celular: celular || undefined,
        camiseta: camiseta || undefined,
      },
    })

    return NextResponse.json({ jugador })
  } catch (error) {
    return handleApiError(error, { context: "torneo3x3 jugador PATCH" })
  }
}
