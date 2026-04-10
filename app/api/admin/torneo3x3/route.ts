import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

async function requireAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const rol = await prisma.usuarioRol.findFirst({
    where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
  })
  if (!rol) return null
  return user
}

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const equipos = await prisma.torneo3x3Equipo.findMany({
      include: {
        jugadores: { orderBy: { posicion: "asc" } },
      },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    })

    // Add completion stats per equipo
    const result = equipos.map(e => {
      const completos = e.jugadores.filter(
        j => !j.nombre.includes("sin registrar") && j.fechaNac && j.nroCi && j.celular && j.camiseta
      ).length
      const total = e.jugadores.length  // all slots including placeholders
      const listoParaCompetir = completos >= 3

      return {
        ...e,
        stats: { completos, total, listoParaCompetir },
      }
    })

    return NextResponse.json({ equipos: result })
  } catch (error) {
    return handleApiError(error, { context: "admin/torneo3x3 GET" })
  }
}
