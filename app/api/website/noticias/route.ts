import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pagina = Math.max(1, parseInt(searchParams.get("pagina") ?? "1"))
    const limite = Math.min(50, parseInt(searchParams.get("limite") ?? "20"))
    const categoria = searchParams.get("categoria")
    const admin = searchParams.get("admin") === "true"

    const where: any = admin ? {} : { publicada: true }
    if (categoria) where.categoria = categoria

    const [noticias, total] = await Promise.all([
      prisma.noticia.findMany({
        where,
        orderBy: [{ destacada: "desc" }, { publicadaEn: "desc" }, { createdAt: "desc" }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.noticia.count({ where }),
    ])

    return NextResponse.json(
      { noticias, total, pagina, totalPaginas: Math.ceil(total / limite) },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (error) {
    return handleApiError(error, { context: "website/noticias" })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { titulo, slug, extracto, contenido, imagenUrl, galeria, videoUrl, categoria, destacada, publicada } = body

    if (!titulo || !slug || !extracto || !contenido || !categoria) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    const noticia = await prisma.noticia.create({
      data: {
        titulo,
        slug,
        extracto,
        contenido,
        imagenUrl: imagenUrl || null,
        galeria: galeria ? JSON.stringify(galeria) : null,
        videoUrl: videoUrl || null,
        categoria,
        destacada: destacada ?? false,
        publicada: publicada ?? false,
        publicadaEn: publicada ? new Date() : null,
        creadoPor: session.user.id,
      },
    })

    // Invalidate ISR cache so new noticia shows up immediately on home & listing
    if (noticia.publicada) {
      revalidatePath("/")
      revalidatePath("/noticias")
      revalidatePath(`/noticias/${noticia.slug}`)
    }

    return NextResponse.json({ noticia }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una noticia con ese slug" }, { status: 409 })
    }
    return handleApiError(error, { context: "website/noticias" })
  }
}
