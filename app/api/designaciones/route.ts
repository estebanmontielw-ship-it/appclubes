import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export const dynamic = "force-dynamic"

function extractVenueName(m: any): string | null {
  if (!m) return null
  if (typeof m.venueName === "string" && m.venueName) return m.venueName
  if (typeof m.venue === "string" && m.venue) return m.venue
  if (m.venue && typeof m.venue === "object") {
    return m.venue.venueName || m.venue.venueNickname || m.venue.name || m.venue.locationName || null
  }
  return null
}

function parseMatches(raw: any): any[] {
  return raw?.response?.data || raw?.data || (Array.isArray(raw) ? raw : [])
}

/** Extract date string from a Genius Sports matchTime/matchDate field.
 *  Handles both "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS" formats. */
function extractDate(m: any): string | null {
  const rawTime = m.matchTime ?? m.matchDate ?? m.date ?? m.startDate ?? null
  if (!rawTime) return null
  const s = String(rawTime)
  // Both space and T separators — just take first 10 chars
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return null
}

function extractTime(m: any): string | null {
  const rawTime = m.matchTime ?? m.startTime ?? m.time ?? null
  if (!rawTime) return null
  const s = String(rawTime)
  // Full datetime: "2026-04-13 20:30:00" or "2026-04-13T20:30:00"
  if (s.includes(" ")) return s.split(" ")[1]?.slice(0, 5) ?? null
  if (s.includes("T")) return s.split("T")[1]?.slice(0, 5) ?? null
  // Time only: "20:30:00"
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  return null
}

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

    // Resolve competition ID (uses env var or auto-detects)
    const { id: competitionId } = await resolveLnbCompetitionIdPublic()
    if (!competitionId) {
      return NextResponse.json({ matches: [], error: "No se encontró la competencia LNB" })
    }

    // Load schedule — use limit=500 to ensure we get the full season
    const raw = await geniusFetch(`/competitions/${competitionId}/matches?limit=500`, "medium")
    const matches = parseMatches(raw)

    // Filter by date if provided
    const filtered = fecha
      ? matches.filter((m: any) => extractDate(m) === fecha)
      : matches.slice(0, 60)

    if (filtered.length === 0) return NextResponse.json({ matches: [], competitionId })

    // Load existing planillas for these matches
    const matchIds = filtered.map((m: any) => String(m.matchId))
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

    const result = filtered.map((m: any) => {
      const fechaStr = extractDate(m) || ""
      const horaStr = extractTime(m) || ""

      // Identify home/away via isHomeCompetitor
      const competitors: any[] = m.competitors || []
      const home = competitors.find((c: any) => c.isHomeCompetitor == 1 || c.isHomeCompetitor === "1" || c.isHomeCompetitor === true) || competitors[0]
      const away = competitors.find((c: any) => c.isHomeCompetitor == 0 || c.isHomeCompetitor === "0" || c.isHomeCompetitor === false) || competitors[1]

      const planilla = planillaMap.get(String(m.matchId)) || null
      const asignados = planilla
        ? [planilla.ccNombre, planilla.a1Nombre, planilla.a2Nombre, planilla.apNombre, planilla.cronNombre, planilla.lanzNombre].filter(Boolean).length
        : 0

      return {
        matchId: String(m.matchId),
        fecha: fechaStr,
        hora: horaStr,
        equipoLocal: home?.competitorName || "Local",
        equipoVisit: away?.competitorName || "Visitante",
        cancha: extractVenueName(m),
        categoria: "LNB",
        planillaId: planilla?.id || null,
        estado: planilla?.estado || null,
        asignados,
        confirmadaEn: planilla?.confirmadaEn || null,
      }
    })

    return NextResponse.json({ matches: result, competitionId })
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
