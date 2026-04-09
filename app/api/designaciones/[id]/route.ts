import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

const CAMPOS_POSICION = ["cc", "a1", "a2", "ap", "cron", "lanz", "esta", "rela"] as const
type CampoPos = typeof CAMPOS_POSICION[number]

const CAMPO_NOMBRE: Record<CampoPos, string> = {
  cc: "Crew Chief", a1: "Auxiliar 1", a2: "Auxiliar 2",
  ap: "Apuntador", cron: "Cronómetro", lanz: "Lanzamiento 24s",
  esta: "Estadístico", rela: "Relator",
}

// GET: Full planilla detail
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const roles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: { in: ["SUPER_ADMIN", "DESIGNADOR"] } },
    })
    if (roles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const planilla = await prisma.planillaDesignacion.findUnique({
      where: { id: params.id },
      include: { logs: { orderBy: { cambiadoEn: "desc" }, take: 50 } },
    })

    if (!planilla) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json({ planilla })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/designaciones/[id]" })
  }
}

// PUT: Update one or more positions in the planilla
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const designadorNombre = `${roles[0].usuario.nombre} ${roles[0].usuario.apellido}`

    const body = await request.json()
    const existing = await prisma.planillaDesignacion.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const updateData: Record<string, any> = {}
    const logs: any[] = []

    // obs field
    if ("obs" in body) {
      updateData.obs = body.obs || null
      if (body.obs !== existing.obs) {
        logs.push({
          planillaId: params.id, accion: "MODIFICADA", campo: "obs",
          valorAnteriorNombre: existing.obs || null, valorNuevoNombre: body.obs || null,
          cambiadoPorId: user.id, cambiadoPorNombre: designadorNombre,
        })
      }
    }

    // Position fields
    for (const campo of CAMPOS_POSICION) {
      if (!(campo in body)) continue
      const { userId, nombre } = body[campo] || { userId: null, nombre: null }

      const idKey = `${campo}Id` as keyof typeof existing
      const nombreKey = `${campo}Nombre` as keyof typeof existing
      const prevId = existing[idKey] as string | null
      const prevNombre = existing[nombreKey] as string | null

      if (userId !== prevId) {
        updateData[idKey] = userId || null
        updateData[nombreKey] = nombre || null
        logs.push({
          planillaId: params.id, accion: "MODIFICADA", campo,
          valorAnteriorId: prevId, valorAnteriorNombre: prevNombre,
          valorNuevoId: userId || null, valorNuevoNombre: nombre || null,
          cambiadoPorId: user.id, cambiadoPorNombre: designadorNombre,
        })
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ planilla: existing })
    }

    const planilla = await prisma.planillaDesignacion.update({
      where: { id: params.id },
      data: updateData,
    })

    if (logs.length > 0) {
      await prisma.planillaDesignacionLog.createMany({ data: logs })
    }

    // If already confirmed and officials changed, update their Designacion entries
    if (existing.estado === "CONFIRMADA" && logs.some(l => CAMPOS_POSICION.includes(l.campo))) {
      await syncDesignaciones(planilla, user.id, true)
    }

    return NextResponse.json({ planilla })
  } catch (error) {
    return handleApiError(error, { context: "PUT /api/designaciones/[id]" })
  }
}

// Helper: sync to Designacion table for officials dashboard
export async function syncDesignaciones(planilla: any, designadorId: string, isUpdate = false) {
  try {
    // Find or create Partido
    let partido = await prisma.partido.findFirst({
      where: { descripcion: `gs:${planilla.matchId}` },
    })

    if (!partido) {
      partido = await prisma.partido.create({
        data: {
          fecha: planilla.fecha,
          hora: planilla.horaStr,
          cancha: planilla.cancha || "Por confirmar",
          ciudad: "",
          categoria: "PRIMERA_DIVISION",
          equipoLocal: planilla.equipoLocal,
          equipoVisit: planilla.equipoVisit,
          descripcion: `gs:${planilla.matchId}`,
          creadoPor: designadorId,
        },
      })
    } else if (isUpdate) {
      // Update match snapshot
      await prisma.partido.update({
        where: { id: partido.id },
        data: {
          fecha: planilla.fecha,
          hora: planilla.horaStr,
          cancha: planilla.cancha || partido.cancha,
          equipoLocal: planilla.equipoLocal,
          equipoVisit: planilla.equipoVisit,
        },
      })
    }

    const ROL_MAP: Record<string, string> = {
      cc: "ARBITRO_PRINCIPAL", a1: "ARBITRO_ASISTENTE_1", a2: "ARBITRO_ASISTENTE_2",
      ap: "MESA_ANOTADOR", cron: "MESA_CRONOMETRADOR", lanz: "MESA_OPERADOR_24S",
      esta: "ESTADISTICO", rela: "MESA_ASISTENTE",
    }

    const positions = [
      { campo: "cc", userId: planilla.ccId },
      { campo: "a1", userId: planilla.a1Id },
      { campo: "a2", userId: planilla.a2Id },
      { campo: "ap", userId: planilla.apId },
      { campo: "cron", userId: planilla.cronId },
      { campo: "lanz", userId: planilla.lanzId },
      { campo: "esta", userId: planilla.estaId },
      { campo: "rela", userId: planilla.relaId },
    ].filter(p => p.userId)

    if (isUpdate) {
      // Remove existing and recreate
      await prisma.designacion.deleteMany({ where: { partidoId: partido.id } })
    }

    for (const { campo, userId } of positions) {
      if (!userId) continue
      const exists = await prisma.usuario.findUnique({ where: { id: userId }, select: { id: true } })
      if (!exists) continue

      await prisma.designacion.upsert({
        where: { partidoId_usuarioId: { partidoId: partido.id, usuarioId: userId } } as any,
        update: { rol: ROL_MAP[campo] as any, asignadoPor: designadorId, estado: "CONFIRMADA" },
        create: {
          partidoId: partido.id, usuarioId: userId,
          rol: ROL_MAP[campo] as any, estado: "CONFIRMADA", asignadoPor: designadorId,
        },
      })
    }

    return partido
  } catch (e) {
    console.error("syncDesignaciones error:", e)
    return null
  }
}
