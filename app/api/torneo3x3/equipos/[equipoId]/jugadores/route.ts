import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// POST /api/torneo3x3/equipos/[equipoId]/jugadores
// No auth required — allows delegates to add players not pre-registered
export async function POST(
  request: Request,
  { params }: { params: { equipoId: string } }
) {
  try {
    const body = await request.json()
    const { nombre, posicion, fechaNac, nroCi, celular, camiseta } = body

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "nombre requerido" }, { status: 400 })
    }
    if (!posicion) {
      return NextResponse.json({ error: "posicion requerida" }, { status: 400 })
    }

    // Verify equipo exists
    const equipo = await prisma.torneo3x3Equipo.findUnique({
      where: { id: params.equipoId },
      select: { id: true },
    })
    if (!equipo) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    const jugador = await prisma.torneo3x3Jugador.create({
      data: {
        equipoId: params.equipoId,
        nombre: nombre.trim(),
        posicion,
        fechaNac: fechaNac || null,
        nroCi: nroCi || null,
        celular: celular || null,
        camiseta: camiseta || null,
      },
    })

    return NextResponse.json({ jugador })
  } catch (error) {
    return handleApiError(error, { context: "torneo3x3 jugador POST" })
  }
}
