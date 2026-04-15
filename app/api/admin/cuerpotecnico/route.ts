import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const tipo = searchParams.get("tipo")

    if (tipo === "stats") {
      const [total, habilitados, pendientes, pendientesPago] = await Promise.all([
        prisma.cuerpoTecnico.count({ where: { activo: true } }),
        prisma.cuerpoTecnico.count({ where: { activo: true, estadoHabilitacion: "HABILITADO" } }),
        prisma.cuerpoTecnico.count({ where: { activo: true, estadoHabilitacion: "PENDIENTE" } }),
        prisma.cuerpoTecnico.count({ where: { activo: true, pagoVerificado: false } }),
      ])
      return NextResponse.json({ total, habilitados, pendientes, pendientesPago })
    }

    const buscar = searchParams.get("buscar")
    const limite = parseInt(searchParams.get("limite") || "100")
    const eliminados = searchParams.get("eliminados") === "true"
    const rol = searchParams.get("rol")

    const where: Record<string, unknown> = { activo: !eliminados }
    if (estado && !eliminados) where.estadoHabilitacion = estado
    if (rol) where.rol = rol

    if (buscar) {
      const normalized = buscar.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
      const words = normalized.split(/\s+/).filter(w => w.length > 1)
      if (words.length > 0) {
        try {
          const wordClauses = words.map(w => {
            const t = `%${w}%`
            return Prisma.sql`(
              unaccent(ct."nombre") ILIKE unaccent(${t})
              OR unaccent(ct."apellido") ILIKE unaccent(${t})
              OR ct."email" ILIKE ${t}
            )`
          })
          const whereWords = Prisma.join(wordClauses, " AND ")
          const activo = !eliminados
          const raw = await prisma.$queryRaw<any[]>`
            SELECT ct.* FROM "cuerpo_tecnico" ct
            WHERE ct."activo" = ${activo}
            AND ${whereWords}
            ORDER BY ct."createdAt" DESC
            LIMIT ${limite}
          `
          // Apply estado/rol filters that can't be in raw SQL easily
          let miembros = raw
          if (estado && !eliminados) miembros = miembros.filter((m: any) => m.estadoHabilitacion === estado)
          if (rol) miembros = miembros.filter((m: any) => m.rol === rol)
          return NextResponse.json({ miembros })
        } catch {
          // unaccent not available — fall back to standard Prisma search
          where.OR = [
            { nombre: { contains: buscar, mode: "insensitive" } },
            { apellido: { contains: buscar, mode: "insensitive" } },
            { email: { contains: buscar, mode: "insensitive" } },
          ]
        }
      }
    }

    const miembros = await prisma.cuerpoTecnico.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limite,
    })

    return NextResponse.json({ miembros })
  } catch (error) {
    return handleApiError(error, { context: "admin/cuerpotecnico" })
  }
}
