import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// POST: Revert a planilla back to BORRADOR (CONFIRMADA → BORRADOR)
// Body: { limpiar: boolean } — if true, also clears all assigned officials
export async function POST(req: Request, { params }: { params: { id: string } }) {
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

    const planilla = await prisma.planillaDesignacion.findUnique({ where: { id: params.id } })
    if (!planilla) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    if (planilla.estado !== "CONFIRMADA") {
      return NextResponse.json({ error: "La planilla no está confirmada" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const limpiar = body.limpiar === true

    const clearFields = limpiar ? {
      ccId: null, ccNombre: null,
      a1Id: null, a1Nombre: null,
      a2Id: null, a2Nombre: null,
      apId: null, apNombre: null,
      cronId: null, cronNombre: null,
      lanzId: null, lanzNombre: null,
      estaId: null, estaNombre: null,
      relaId: null, relaNombre: null,
    } : {}

    // Revert to BORRADOR
    const updated = await prisma.planillaDesignacion.update({
      where: { id: params.id },
      data: {
        estado: "BORRADOR",
        confirmadoPorId: null,
        confirmadoPorNombre: null,
        confirmadaEn: null,
        ...clearFields,
      },
    })

    // Audit log
    await prisma.planillaDesignacionLog.create({
      data: {
        planillaId: params.id,
        accion: "MODIFICADA",
        campo: "estado",
        valorAnteriorNombre: "CONFIRMADA",
        valorNuevoNombre: limpiar ? "BORRADOR (limpiada)" : "BORRADOR",
        cambiadoPorId: user.id,
        cambiadoPorNombre: designadorNombre,
      },
    })

    // Remove Designacion records so Mis Partidos is cleaned up
    const partido = await prisma.partido.findFirst({
      where: { descripcion: `gs:${planilla.matchId}` },
    })
    if (partido) {
      await prisma.designacion.deleteMany({ where: { partidoId: partido.id } })
    }

    return NextResponse.json({ planilla: updated })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/designaciones/[id]/desconfirmar" })
  }
}
