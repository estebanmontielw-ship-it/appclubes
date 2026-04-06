import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

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

    const nombreNorm = normalizeName(nombre)
    const apellidoNorm = normalizeName(apellido)
    const fullNameNorm = normalizeName(`${nombre} ${apellido}`)
    const allParts = fullNameNorm.split(" ").filter(p => p.length > 1)

    const allPre = await prisma.ctPreverificado.findMany({
      where: { usado: false },
    })

    let bestMatch: typeof allPre[0] | null = null
    let bestScore = 0

    for (const pre of allPre) {
      const preNorm = pre.nombreNormalizado
      const preParts = preNorm.split(" ").filter(p => p.length > 1)

      // Method 1: count matching parts (original)
      const score1 = allParts.filter(p => preParts.some(pp => pp === p || pp.startsWith(p) || p.startsWith(pp))).length
      const score2 = preParts.filter(pp => allParts.some(p => p === pp || p.startsWith(pp) || pp.startsWith(p))).length

      // Method 2: check if apellido is contained in pre name
      const apellidoParts = apellidoNorm.split(" ").filter(p => p.length > 2)
      const apellidoMatch = apellidoParts.some(ap => preNorm.includes(ap))

      // Method 3: check if first nombre part matches
      const nombreParts = nombreNorm.split(" ").filter(p => p.length > 2)
      const nombreMatch = nombreParts.some(np => preNorm.includes(np))

      // Score: use best method
      let finalScore = Math.max(score1, score2)

      // Require BOTH apellido AND nombre to match — prevents false positives
      if (apellidoMatch && nombreMatch) {
        finalScore = Math.max(finalScore, 3)
      }

      if (finalScore >= 3 && finalScore > bestScore) {
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
  } catch (error) {
    return NextResponse.json({ found: false })
  }
}
