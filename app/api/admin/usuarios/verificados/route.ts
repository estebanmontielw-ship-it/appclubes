import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

// Get verified users for designation dropdowns
export async function GET(request: Request) {
  try {
    const auth = await requireRole("SUPER_ADMIN", "INSTRUCTOR", "DESIGNADOR")
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const rol = searchParams.get("rol")

    const where: any = { estadoVerificacion: "VERIFICADO" }

    if (rol) {
      where.roles = { some: { rol } }
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: { id: true, nombre: true, apellido: true, cedula: true, roles: { select: { rol: true } } },
      orderBy: { apellido: "asc" },
    })

    return NextResponse.json({ usuarios })
  } catch (error) {
    return handleApiError(error, { context: "admin/usuarios/verificados" })
  }
}
