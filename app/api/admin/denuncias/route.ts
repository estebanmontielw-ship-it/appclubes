import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"
import type { EstadoDenuncia, TipoSituacionDenuncia, Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

const ESTADOS_VALIDOS: EstadoDenuncia[] = ["NUEVA", "EN_REVISION", "ESCALADA", "ARCHIVADA"]
const TIPOS_VALIDOS: TipoSituacionDenuncia[] = [
  "MANIPULACION_RESULTADO",
  "ACTIVIDAD_APUESTAS",
  "SOBORNO_INCENTIVO",
  "CONDUCTA_SOSPECHOSA",
  "OTRA",
]

async function requireSuperAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }

  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
  })
  if (adminRoles.length === 0) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }
  return { user }
}

export async function GET(request: Request) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const estado = url.searchParams.get("estado")
    const tipo = url.searchParams.get("tipo")
    const buscar = url.searchParams.get("buscar")?.trim()

    const where: Prisma.DenunciaWhereInput = {}
    if (estado && ESTADOS_VALIDOS.includes(estado as EstadoDenuncia)) {
      where.estado = estado as EstadoDenuncia
    }
    if (tipo && TIPOS_VALIDOS.includes(tipo as TipoSituacionDenuncia)) {
      where.tipoSituacion = tipo as TipoSituacionDenuncia
    }
    if (buscar) {
      where.OR = [
        { descripcion: { contains: buscar, mode: "insensitive" } },
        { competencia: { contains: buscar, mode: "insensitive" } },
        { partidoEvento: { contains: buscar, mode: "insensitive" } },
        { personasInvolucradas: { contains: buscar, mode: "insensitive" } },
        { contactoNombre: { contains: buscar, mode: "insensitive" } },
      ]
    }

    const [denuncias, totalNuevas] = await Promise.all([
      prisma.denuncia.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.denuncia.count({ where: { estado: "NUEVA" } }),
    ])

    return NextResponse.json({ denuncias, totalNuevas })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/denuncias" })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const { id, estado, notasAdmin } = await request.json()
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const data: Prisma.DenunciaUpdateInput = {}
    if (estado) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
      }
      data.estado = estado
    }
    if (typeof notasAdmin === "string") {
      data.notasAdmin = notasAdmin.slice(0, 5000)
    }

    const denuncia = await prisma.denuncia.update({
      where: { id },
      data,
    })

    return NextResponse.json({ denuncia })
  } catch (error) {
    return handleApiError(error, { context: "PATCH /api/admin/denuncias" })
  }
}
