import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

/**
 * Devuelve URLs firmadas (1 hora de validez) para los archivos de evidencia
 * adjuntos a una denuncia. Bucket privado, sólo SUPER_ADMIN.
 */
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const url = new URL(request.url)
    const denunciaId = url.searchParams.get("id")
    if (!denunciaId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    const denuncia = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
      select: { archivosUrls: true },
    })
    if (!denuncia) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const paths: string[] = denuncia.archivosUrls
      ? (() => {
          try { return JSON.parse(denuncia.archivosUrls) as string[] }
          catch { return [] }
        })()
      : []

    if (paths.length === 0) return NextResponse.json({ archivos: [] })

    const service = createServiceClient()
    const signed = await Promise.all(
      paths.map(async (path) => {
        const { data, error } = await service.storage
          .from("denuncias-evidencia")
          .createSignedUrl(path, 60 * 60)
        return error ? { path, url: null, error: error.message } : { path, url: data.signedUrl }
      })
    )

    return NextResponse.json({ archivos: signed })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/denuncias/evidencia" })
  }
}
