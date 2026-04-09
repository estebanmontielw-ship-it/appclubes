import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"
import { loadLnbSchedule } from "@/lib/genius-sports"

export const dynamic = "force-dynamic"

// GET: List GS matches for a date range, merged with DB planilla status
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
    const fecha = searchParams.get("fecha") // YYYY-MM-DD

    // Load schedule from Genius Sports
    const { matches } = await loadLnbSchedule()

    // Filter by date if provided
    const filtered = fecha
      ? matches.filter(m => m.matchTime?.startsWith(fecha))
      : matches.slice(0, 60) // default: next 60 matches

    if (filtered.length === 0) return NextResponse.json({ matches: [] })

    // Load existing planillas for these matches
    const matchIds = filtered.map(m => String(m.matchId))
    const planillas = await prisma.planillaDesignacion.findMany({
      where: { matchId: { in: matchIds } },
      select: {
        id: true, matchId: true, estado: true,
        ccNombre: true, a1Nombre: true, a2Nombre: true,
        apNombre: true, cronNombre: true, lanzNombre: true,
        estaId: true, relaId: true,
        confirmadaEn: true,
      },
    })

    const planillaMap = new Map(planillas.map(p => [p.matchId, p]))

    const result = filtered.map(m => {
      const [fechaStr, horaStr] = (m.matchTime || "").split(" ")
      const planilla = planillaMap.get(String(m.matchId)) || null
      const asignados = planilla
        ? [planilla.ccNombre, planilla.a1Nombre, planilla.a2Nombre, planilla.apNombre, planilla.cronNombre, planilla.lanzNombre].filter(Boolean).length
        : 0
      return {
        matchId: String(m.matchId),
        fecha: fechaStr,
        hora: horaStr?.slice(0, 5) || "",
        equipoLocal: m.homeName,
        equipoVisit: m.awayName,
        cancha: m.venue,
        categoria: "LNB",
        planillaId: planilla?.id || null,
        estado: planilla?.estado || null,
        asignados,
        confirmadaEn: planilla?.confirmadaEn || null,
      }
    })

    return NextResponse.json({ matches: result })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/designaciones" })
  }
}

// POST: Create or update planilla for a match
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const roles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: { in: ["SUPER_ADMIN", "DESIGNADOR"] } },
      include: { usuario: { select: { nombre: true, apellido: true } } },
    })
    if (roles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const designador = roles[0].usuario
    const designadorNombre = `${designador.nombre} ${designador.apellido}`

    const body = await request.json()
    const { matchId, competicionId, categoria, fecha, horaStr, equipoLocal, equipoVisit, cancha } = body

    if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 })

    // Upsert planilla
    const existing = await prisma.planillaDesignacion.findUnique({ where: { matchId } })

    let planilla
    if (existing) {
      // Update snapshot data
      planilla = await prisma.planillaDesignacion.update({
        where: { matchId },
        data: { competicionId, categoria, fecha: new Date(fecha), horaStr, equipoLocal, equipoVisit, cancha: cancha || null },
      })
    } else {
      planilla = await prisma.planillaDesignacion.create({
        data: {
          matchId, competicionId: competicionId || "LNB", categoria: categoria || "LNB",
          fecha: new Date(fecha), horaStr, equipoLocal, equipoVisit, cancha: cancha || null,
          creadoPorId: user.id, creadoPorNombre: designadorNombre,
        },
      })
      // Log creation
      await prisma.planillaDesignacionLog.create({
        data: {
          planillaId: planilla.id, accion: "CREADA",
          cambiadoPorId: user.id, cambiadoPorNombre: designadorNombre,
        },
      })
    }

    return NextResponse.json({ planilla }, { status: existing ? 200 : 201 })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/designaciones" })
  }
}
