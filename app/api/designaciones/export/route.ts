import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

const CAMPO_NOMBRE: Record<string, string> = {
  cc: "Crew Chief", a1: "Auxiliar 1", a2: "Auxiliar 2",
  ap: "Apuntador", cron: "Cronómetro", lanz: "Lanzamiento 24s",
  esta: "Estadístico", rela: "Relator",
}

// GET: Export planillas for a date as JSON (client renders to PDF/PNG)
// ?fecha=YYYY-MM-DD
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const roles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: { in: ["SUPER_ADMIN", "DESIGNADOR"] } },
    })
    if (roles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha") // YYYY-MM-DD required

    if (!fecha) return NextResponse.json({ error: "fecha requerida (YYYY-MM-DD)" }, { status: 400 })

    const start = new Date(`${fecha}T00:00:00.000Z`)
    const end = new Date(`${fecha}T23:59:59.999Z`)

    const planillas = await prisma.planillaDesignacion.findMany({
      where: { fecha: { gte: start, lte: end } },
      orderBy: { horaStr: "asc" },
    })

    const result = planillas.map(p => ({
      id: p.id,
      matchId: p.matchId,
      fecha: p.fecha,
      horaStr: p.horaStr,
      equipoLocal: p.equipoLocal,
      equipoVisit: p.equipoVisit,
      cancha: p.cancha,
      estado: p.estado,
      obs: p.obs,
      posiciones: [
        { campo: "cc", label: CAMPO_NOMBRE.cc, id: p.ccId, nombre: p.ccNombre },
        { campo: "a1", label: CAMPO_NOMBRE.a1, id: p.a1Id, nombre: p.a1Nombre },
        { campo: "a2", label: CAMPO_NOMBRE.a2, id: p.a2Id, nombre: p.a2Nombre },
        { campo: "ap", label: CAMPO_NOMBRE.ap, id: p.apId, nombre: p.apNombre },
        { campo: "cron", label: CAMPO_NOMBRE.cron, id: p.cronId, nombre: p.cronNombre },
        { campo: "lanz", label: CAMPO_NOMBRE.lanz, id: p.lanzId, nombre: p.lanzNombre },
        { campo: "esta", label: CAMPO_NOMBRE.esta, id: p.estaId, nombre: p.estaNombre },
        { campo: "rela", label: CAMPO_NOMBRE.rela, id: p.relaId, nombre: p.relaNombre },
      ],
      confirmadaEn: p.confirmadaEn,
      confirmadoPorNombre: p.confirmadoPorNombre,
    }))

    return NextResponse.json({ fecha, planillas: result })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/designaciones/export" })
  }
}
