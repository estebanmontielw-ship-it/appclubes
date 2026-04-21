import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { EstadoVerificacion } from "@prisma/client"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Check admin role
    const adminRoles = await prisma.usuarioRol.findMany({
      where: {
        usuarioId: session.user.id,
        rol: { in: ["SUPER_ADMIN", "INSTRUCTOR", "VERIFICADOR"] },
      },
    })

    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") as EstadoVerificacion | null
    const buscar = searchParams.get("buscar")
    const rol = searchParams.get("rol")

    const where: Record<string, unknown> = {}

    if (estado) {
      where.estadoVerificacion = estado
    }

    if (rol) {
      where.roles = { some: { rol } }
    }

    if (buscar) {
      // Normalize search term: strip accents so "Benitez" matches "Benítez"
      const normalized = buscar.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const isCi = /^\d+$/.test(buscar.trim())

      if (isCi) {
        // Pure number → search only by cedula
        where.cedula = { contains: buscar.trim() }
      } else {
        // Text → try accent-insensitive via PostgreSQL unaccent extension.
        // Falls back to standard Prisma search if unaccent is unavailable.
        try {
          const term = `%${normalized}%`
          const raw = await prisma.$queryRaw<any[]>`
            SELECT u.* FROM "usuarios" u
            WHERE (
              unaccent(u."nombre") ILIKE unaccent(${term})
              OR unaccent(u."apellido") ILIKE unaccent(${term})
              OR u."cedula" ILIKE ${term}
            )
            ORDER BY u."createdAt" DESC
          `
          // Fetch roles separately and merge
          const ids = raw.map((r: any) => r.id)
          const rolesAll = await prisma.usuarioRol.findMany({ where: { usuarioId: { in: ids } } })
          const rolesById = new Map<string, typeof rolesAll>()
          for (const r of rolesAll) {
            if (!rolesById.has(r.usuarioId)) rolesById.set(r.usuarioId, [])
            rolesById.get(r.usuarioId)!.push(r)
          }
          let usuarios = raw.map((u: any) => ({ ...u, roles: rolesById.get(u.id) ?? [] }))

          // Apply estado and rol filters that couldn't be in the raw query
          if (estado) {
            usuarios = usuarios.filter((u: any) => u.estadoVerificacion === estado)
          }
          if (rol) {
            usuarios = usuarios.filter((u: any) =>
              (rolesById.get(u.id) ?? []).some((r: any) => String(r.rol).includes(rol))
            )
          }

          return NextResponse.json({ usuarios })
        } catch {
          // unaccent not available — fall back to standard search
          where.OR = [
            { nombre: { contains: buscar, mode: "insensitive" } },
            { apellido: { contains: buscar, mode: "insensitive" } },
            { cedula: { contains: buscar } },
          ]
        }
      }
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      include: { roles: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({ usuarios })
  } catch (error) {
    return handleApiError(error, { context: "admin/usuarios" })
  }
}
