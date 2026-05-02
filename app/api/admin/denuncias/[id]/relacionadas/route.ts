import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

async function requireSuperAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
  })
  if (adminRoles.length === 0) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }
  return { user }
}

/**
 * GET /api/admin/denuncias/[id]/relacionadas
 *
 * Devuelve las denuncias relacionadas a la del id dado, matched por:
 *   - misma ipReal
 *   - mismo ipHash
 *   - mismo browserFingerprint
 *
 * Para cada una indica el motivo del match para que el admin entienda
 * qué tan fuerte es la relación.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const denuncia = await prisma.denuncia.findUnique({
      where: { id: params.id },
      select: {
        ipReal: true, ipHash: true, browserFingerprint: true,
        pais: true, ciudad: true, asn: true,
      },
    })
    if (!denuncia) {
      return NextResponse.json({ error: "Denuncia no encontrada" }, { status: 404 })
    }

    const orConditions: any[] = []
    if (denuncia.ipReal) orConditions.push({ ipReal: denuncia.ipReal })
    if (denuncia.ipHash) orConditions.push({ ipHash: denuncia.ipHash })
    if (denuncia.browserFingerprint) orConditions.push({ browserFingerprint: denuncia.browserFingerprint })

    if (orConditions.length === 0) {
      return NextResponse.json({ relacionadas: [] })
    }

    const relacionadas = await prisma.denuncia.findMany({
      where: { id: { not: params.id }, OR: orConditions },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        tipoSituacion: true,
        descripcion: true,
        modo: true,
        contactoNombre: true,
        estado: true,
        createdAt: true,
        ipReal: true,
        ipHash: true,
        browserFingerprint: true,
        pais: true,
        ciudad: true,
        asn: true,
      },
    })

    // Etiquetar cada relación con el motivo del match
    const enriched = relacionadas.map((r) => {
      const motivos: string[] = []
      if (denuncia.ipReal && r.ipReal === denuncia.ipReal) motivos.push("misma_ip")
      if (denuncia.ipHash && r.ipHash === denuncia.ipHash) motivos.push("mismo_ip_hash")
      if (denuncia.browserFingerprint && r.browserFingerprint === denuncia.browserFingerprint) motivos.push("mismo_navegador")
      return { ...r, motivos }
    })

    return NextResponse.json({
      relacionadas: enriched,
      reportante: {
        ipReal: denuncia.ipReal,
        pais: denuncia.pais,
        ciudad: denuncia.ciudad,
        asn: denuncia.asn,
        browserFingerprint: denuncia.browserFingerprint,
      },
    })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/denuncias/[id]/relacionadas" })
  }
}
