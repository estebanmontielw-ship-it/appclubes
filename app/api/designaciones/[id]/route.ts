import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"
import { syncDesignaciones } from "@/lib/sync-designaciones"

export const dynamic = "force-dynamic"

const CAMPOS_POSICION = ["cc", "a1", "a2", "ap", "cron", "lanz", "esta", "rela"] as const
type CampoPos = typeof CAMPOS_POSICION[number]

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
      include: {
        logs: {
          where: { planillaId: params.id },
          orderBy: { cambiadoEn: "desc" },
          take: 50,
        },
      },
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
