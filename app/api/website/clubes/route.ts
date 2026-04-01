import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const clubes = await prisma.club.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    })
    return NextResponse.json({ clubes })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()
    const { nombre, slug, sigla, logoUrl, ciudad, direccion, telefono, email, sitioWeb, instagram, facebook, descripcion, orden } = body

    if (!nombre || !slug || !ciudad) {
      return NextResponse.json({ error: "Nombre, slug y ciudad son requeridos" }, { status: 400 })
    }

    const club = await prisma.club.create({
      data: {
        nombre, slug, ciudad,
        sigla: sigla || null,
        logoUrl: logoUrl || null,
        direccion: direccion || null,
        telefono: telefono || null,
        email: email || null,
        sitioWeb: sitioWeb || null,
        instagram: instagram || null,
        facebook: facebook || null,
        descripcion: descripcion || null,
        orden: orden ?? 0,
      },
    })

    return NextResponse.json({ club }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un club con ese slug" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
