import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

function normalizeName(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Search in registered CT — accent-insensitive, multi-word
    const qNorm = normalizeName(q)
    const words = qNorm.split(/\s+/).filter(w => w.length > 1)
    let registered: any[]
    try {
      const wordClauses = words.map(w => {
        const t = `%${w}%`
        return Prisma.sql`(
          unaccent(ct."nombre") ILIKE unaccent(${t})
          OR unaccent(ct."apellido") ILIKE unaccent(${t})
          OR ct."cedula" ILIKE ${t}
        )`
      })
      const whereWords = Prisma.join(wordClauses, " AND ")
      registered = await prisma.$queryRaw<any[]>`
        SELECT ct."id", ct."nombre", ct."apellido", ct."cedula", ct."rol",
               ct."ciudad", ct."estadoHabilitacion", ct."fotoCarnetUrl", ct."qrToken"
        FROM "cuerpo_tecnico" ct
        WHERE ct."activo" = true
        AND ${whereWords}
        LIMIT 10
      `
    } catch {
      // unaccent not available — fall back to standard Prisma search
      registered = await prisma.cuerpoTecnico.findMany({
        where: {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { apellido: { contains: q, mode: "insensitive" } },
            { cedula: { contains: q } },
          ],
        },
        select: {
          id: true, nombre: true, apellido: true, cedula: true,
          rol: true, ciudad: true, estadoHabilitacion: true,
          fotoCarnetUrl: true, qrToken: true,
        },
        take: 10,
      })
    }

    // Search in pre-verified — DB-level filter then in-memory AND logic for multi-word
    const qParts = qNorm.split(/\s+/).filter(p => p.length > 1)

    // Pre-filter at DB level: any record containing at least one search word
    const candidates = await prisma.ctPreverificado.findMany({
      where: {
        OR: qParts.map(part => ({ nombreNormalizado: { contains: part } })),
      },
      take: 50,
    })

    // In-memory: require ALL words to appear in the name (AND logic)
    const preMatches = candidates.filter(p => {
      const nameNorm = p.nombreNormalizado?.trim() || normalizeName(p.nombre)
      if (nameNorm.includes(qNorm)) return true
      return qParts.every(part => nameNorm.includes(part))
    }).slice(0, 10)

    return NextResponse.json({
      registered: registered.map(r => ({
        ...r,
        type: "registered",
      })),
      preVerified: preMatches.map(p => ({
        nombre: p.nombre,
        rol: p.rol,
        type: "pre-verified",
      })),
    })
  } catch (error) {
    return handleApiError(error, { context: "ct/buscar" })
  }
}
