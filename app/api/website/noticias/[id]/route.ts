import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const noticia = await prisma.noticia.findUnique({ where: { id: params.id } })
    if (!noticia) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json({ noticia })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
    const { titulo, slug, extracto, contenido, imagenUrl, galeria, videoUrl, categoria, destacada, publicada, autorNombre } = body

    const existing = await prisma.noticia.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const noticia = await prisma.noticia.update({
      where: { id: params.id },
      data: {
        ...(titulo && { titulo }),
        ...(slug && { slug }),
        ...(extracto && { extracto }),
        ...(contenido && { contenido }),
        ...(imagenUrl !== undefined && { imagenUrl: imagenUrl || null }),
        ...(galeria !== undefined && { galeria: galeria ? JSON.stringify(galeria) : null }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(categoria && { categoria }),
        ...(destacada !== undefined && { destacada }),
        ...(autorNombre !== undefined && { autorNombre: autorNombre || null }),
        ...(publicada !== undefined && {
          publicada,
          publicadaEn: publicada && !existing.publicadaEn ? new Date() : existing.publicadaEn,
        }),
      },
    })

    return NextResponse.json({ noticia })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una noticia con ese slug" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    await prisma.noticia.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
