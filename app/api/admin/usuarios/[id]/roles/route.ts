import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "Solo SUPER_ADMIN puede asignar roles" }, { status: 403 })
    }

    const { rol, accion } = await request.json()

    if (!["VERIFICADOR", "INSTRUCTOR", "DESIGNADOR"].includes(rol)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 })
    }

    if (accion === "agregar") {
      await prisma.usuarioRol.upsert({
        where: { usuarioId_rol: { usuarioId: params.id, rol } },
        create: { usuarioId: params.id, rol },
        update: {},
      })
    } else if (accion === "quitar") {
      await prisma.usuarioRol.deleteMany({
        where: { usuarioId: params.id, rol },
      })
    } else {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
