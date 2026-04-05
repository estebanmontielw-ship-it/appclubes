import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireRole, isAuthError } from "@/lib/api-auth"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole("SUPER_ADMIN", "DESIGNADOR")
    if (isAuthError(auth)) return auth

    const partido = await prisma.partido.findUnique({
      where: { id: params.id },
      include: {
        designaciones: {
          include: { usuario: { select: { id: true, nombre: true, apellido: true, roles: { select: { rol: true } } } } },
          orderBy: { createdAt: "asc" },
        },
      },
    })
    if (!partido) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ partido })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole("SUPER_ADMIN", "DESIGNADOR")
    if (isAuthError(auth)) return auth

    const body = await request.json()
    const partido = await prisma.partido.update({
      where: { id: params.id },
      data: {
        ...(body.estado !== undefined && { estado: body.estado }),
        ...(body.fecha !== undefined && { fecha: new Date(body.fecha) }),
        ...(body.hora !== undefined && { hora: body.hora }),
        ...(body.cancha !== undefined && { cancha: body.cancha }),
        ...(body.ciudad !== undefined && { ciudad: body.ciudad }),
      },
    })
    return NextResponse.json({ partido })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
