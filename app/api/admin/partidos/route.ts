import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireRole, isAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    const auth = await requireRole("SUPER_ADMIN", "DESIGNADOR")
    if (isAuthError(auth)) return auth

    const partidos = await prisma.partido.findMany({
      include: {
        designaciones: {
          include: { usuario: { select: { id: true, nombre: true, apellido: true } } },
        },
        _count: { select: { designaciones: true } },
      },
      orderBy: { fecha: "desc" },
    })
    return NextResponse.json({ partidos })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole("SUPER_ADMIN", "DESIGNADOR")
    if (isAuthError(auth)) return auth

    const { fecha, hora, cancha, ciudad, categoria, equipoLocal, equipoVisit, descripcion } = await request.json()

    if (!fecha || !hora || !cancha || !ciudad || !categoria || !equipoLocal || !equipoVisit) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const partido = await prisma.partido.create({
      data: {
        fecha: new Date(fecha),
        hora,
        cancha,
        ciudad,
        categoria,
        equipoLocal,
        equipoVisit,
        descripcion: descripcion || null,
        creadoPor: auth.user.id,
      },
    })

    return NextResponse.json({ partido }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
