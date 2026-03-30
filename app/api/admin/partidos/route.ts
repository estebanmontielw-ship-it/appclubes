import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
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
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: { in: ["SUPER_ADMIN", "DESIGNADOR"] } },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

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
        creadoPor: session.user.id,
      },
    })

    return NextResponse.json({ partido }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
