import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

function normalizeName(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Search in registered CT
    const registered = await prisma.cuerpoTecnico.findMany({
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

    // Search in pre-verified (not yet registered)
    const qNorm = normalizeName(q)
    const allPre = await prisma.ctPreverificado.findMany({
      where: { usado: false },
    })
    const preMatches = allPre.filter(p =>
      p.nombreNormalizado.includes(qNorm) || qNorm.split(" ").some(part => part.length > 2 && p.nombreNormalizado.includes(part))
    ).slice(0, 5)

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
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
