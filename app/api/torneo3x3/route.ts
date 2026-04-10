import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// GET /api/torneo3x3?categoria=Femenino+Open
// Returns all teams with their players, optionally filtered by categoria
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get("categoria")

    const equipos = await prisma.torneo3x3Equipo.findMany({
      where: categoria ? { categoria } : undefined,
      include: {
        jugadores: { orderBy: { posicion: "asc" } },
      },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json({ equipos })
  } catch (error) {
    return handleApiError(error, { context: "torneo3x3 GET" })
  }
}
