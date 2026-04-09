import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// GET: Search officials for designation
// ?q=nombre&rol=ARBITRO|MESA|any
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
    const q = searchParams.get("q")?.trim() || ""
    const rolFilter = searchParams.get("rol") // "ARBITRO" | "MESA" | "ESTADISTICO" | null (all)

    // Determine which roles to include
    let rolesRequeridos: string[] = []
    if (rolFilter === "ARBITRO") {
      rolesRequeridos = ["ARBITRO"]
    } else if (rolFilter === "MESA") {
      rolesRequeridos = ["MESA", "ESTADISTICO"]
    } else {
      rolesRequeridos = ["ARBITRO", "MESA", "ESTADISTICO"]
    }

    // Find users with required roles that are verified
    const usuariosConRol = await prisma.usuarioRol.findMany({
      where: { rol: { in: rolesRequeridos as any } },
      select: { usuarioId: true },
    })
    const idsConRol = [...new Set(usuariosConRol.map(u => u.usuarioId))]

    if (idsConRol.length === 0) return NextResponse.json({ oficiales: [] })

    const whereClause: any = {
      id: { in: idsConRol },
      estadoVerificacion: "VERIFICADO",
      activo: true,
    }

    if (q.length >= 2) {
      whereClause.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { apellido: { contains: q, mode: "insensitive" } },
        { cedula: { contains: q } },
      ]
    }

    const usuarios = await prisma.usuario.findMany({
      where: whereClause,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cedula: true,
        fotoCarnetUrl: true,
        ciudad: true,
        roles: {
          select: { rol: true },
        },
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      take: 30,
    })

    const oficiales = usuarios.map(u => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      nombreCompleto: `${u.nombre} ${u.apellido}`,
      cedula: u.cedula,
      fotoCarnetUrl: u.fotoCarnetUrl,
      ciudad: u.ciudad,
      roles: u.roles.map(r => r.rol),
    }))

    return NextResponse.json({ oficiales })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/designaciones/oficiales" })
  }
}
