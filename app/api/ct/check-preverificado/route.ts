import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

export async function POST(request: Request) {
  try {
    const { nombre, apellido } = await request.json()

    if (!nombre || !apellido) {
      return NextResponse.json({ found: false })
    }

    const fullNameNorm = normalizeName(`${nombre} ${apellido}`)
    const nameParts = fullNameNorm.split(" ").filter(p => p.length > 2)

    const allPre = await prisma.ctPreverificado.findMany({
      where: { usado: false },
    })

    let bestMatch: typeof allPre[0] | null = null
    let bestScore = 0

    for (const pre of allPre) {
      const preParts = pre.nombreNormalizado.split(" ").filter(p => p.length > 2)

      const score1 = nameParts.filter(p => preParts.some(pp => pp === p || pp.startsWith(p) || p.startsWith(pp))).length
      const score2 = preParts.filter(pp => nameParts.some(p => p === pp || p.startsWith(pp) || pp.startsWith(p))).length
      const finalScore = Math.max(score1, score2)

      if (finalScore >= 2 && finalScore > bestScore) {
        bestScore = finalScore
        bestMatch = pre
      }
    }

    if (bestMatch) {
      return NextResponse.json({
        found: true,
        nombre: bestMatch.nombre,
        rol: bestMatch.rol,
        datosFactura: bestMatch.datosFactura,
      })
    }

    return NextResponse.json({ found: false })
  } catch {
    return NextResponse.json({ found: false })
  }
}
