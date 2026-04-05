import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clave = searchParams.get("clave")

    if (clave) {
      const pagina = await prisma.paginaContenido.findUnique({ where: { clave } })
      return NextResponse.json(
        { pagina },
        { headers: { "Cache-Control": "public, s-maxage=7200, stale-while-revalidate=14400" } }
      )
    }

    const paginas = await prisma.paginaContenido.findMany({
      where: { activo: true },
      orderBy: { clave: "asc" },
    })
    return NextResponse.json(
      { paginas },
      { headers: { "Cache-Control": "public, s-maxage=7200, stale-while-revalidate=14400" } }
    )
  } catch (error) {
    return handleApiError(error, { context: "website/paginas" })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()
    const { clave, titulo, contenido, imagenUrl } = body

    if (!clave || !titulo || !contenido) {
      return NextResponse.json({ error: "Clave, titulo y contenido son requeridos" }, { status: 400 })
    }

    // Upsert - create or update
    const pagina = await prisma.paginaContenido.upsert({
      where: { clave },
      update: { titulo, contenido, imagenUrl: imagenUrl || null },
      create: { clave, titulo, contenido, imagenUrl: imagenUrl || null },
    })

    return NextResponse.json({ pagina })
  } catch (error) {
    return handleApiError(error, { context: "website/paginas" })
  }
}
