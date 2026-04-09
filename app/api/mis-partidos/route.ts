import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const designaciones = await prisma.designacion.findMany({
      where: { usuarioId: user.id },
      include: { partido: true },
      orderBy: { partido: { fecha: "asc" } },
    })

    const result = designaciones.map(d => ({
      id: d.id,
      rol: d.rol,
      estado: d.estado,
      partido: {
        id: d.partido.id,
        fecha: d.partido.fecha,
        hora: d.partido.hora,
        cancha: d.partido.cancha,
        ciudad: d.partido.ciudad,
        categoria: d.partido.categoria,
        equipoLocal: d.partido.equipoLocal,
        equipoVisit: d.partido.equipoVisit,
        estado: d.partido.estado,
        // Extract matchId from descripcion "gs:{matchId}" for LNB live stats link
        matchId: d.partido.descripcion?.startsWith("gs:")
          ? d.partido.descripcion.slice(3)
          : null,
      },
    }))

    return NextResponse.json({ designaciones: result })
  } catch (error) {
    return handleApiError(error, { context: "mis-partidos" })
  }
}
