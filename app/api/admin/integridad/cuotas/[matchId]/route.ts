import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"
import { scrapeCuotasPartido } from "@/lib/integridad-scrapers"

export const dynamic = "force-dynamic"
export const maxDuration = 60

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

/** GET — devuelve cuotas históricas del partido (todas las fuentes). */
export async function GET(
  _req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error
    const cuotas = await prisma.integridadCuota.findMany({
      where: { matchId: params.matchId },
      orderBy: { capturadoEn: "desc" },
      take: 200,
    })
    return NextResponse.json({ matchId: params.matchId, cuotas })
  } catch (error) {
    return handleApiError(error, { context: "GET /api/admin/integridad/cuotas/[matchId]" })
  }
}

/** POST — dispara scraping en TODAS las fuentes y persiste resultados. */
export async function POST(
  _req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    // Resolver nombres + fecha del partido (del análisis cacheado)
    const analisis = await prisma.integridadAnalisis.findUnique({
      where: { matchId: params.matchId },
      select: { equipoLocal: true, equipoVisit: true, fecha: true },
    })
    const equipoLocal = analisis?.equipoLocal ?? ""
    const equipoVisit = analisis?.equipoVisit ?? ""
    const fecha = analisis?.fecha ? analisis.fecha.toISOString().slice(0, 10) : undefined

    const resultados = await scrapeCuotasPartido(params.matchId, equipoLocal, equipoVisit, fecha)

    // Persistir cada intento (los exitosos como cuotas reales,
    // los fallidos como registros de auditoría con errorMessage)
    type FilaCuota = {
      matchId: string
      fuente: string
      fuenteUrl: string | null
      mercado: string
      linea: number | null
      lado: string | null
      cuota: number
      raw: any
      ok: boolean
      errorMessage: string | null
    }
    const filas: FilaCuota[] = resultados.flatMap((r): FilaCuota[] => {
      if (r.ok && r.cuotas.length > 0) {
        return r.cuotas.map((c): FilaCuota => ({
          matchId: params.matchId,
          fuente: r.fuente,
          fuenteUrl: c.fuenteUrl ?? null,
          mercado: c.mercado,
          linea: c.linea ?? null,
          lado: c.lado ?? null,
          cuota: c.cuota,
          raw: (c.raw ?? null) as any,
          ok: true,
          errorMessage: null,
        }))
      }
      // Falló — guardamos un registro placeholder con errorMessage
      return [{
        matchId: params.matchId,
        fuente: r.fuente,
        fuenteUrl: null,
        mercado: "total_over_under",  // placeholder
        linea: null,
        lado: null,
        cuota: 0,
        raw: { notas: r.notas } as any,
        ok: false,
        errorMessage: r.errorMessage ?? "UNKNOWN",
      }]
    })

    if (filas.length > 0) {
      await prisma.integridadCuota.createMany({ data: filas })
    }

    await prisma.integridadAuditLog.create({
      data: {
        matchId: params.matchId,
        accion: "scrape_cuotas",
        detalles: {
          fuentesIntentadas: resultados.length,
          ok: resultados.filter(r => r.ok).length,
          fallidas: resultados.filter(r => !r.ok).length,
        } as any,
      },
    })

    return NextResponse.json({
      matchId: params.matchId,
      resultados: resultados.map(r => ({
        fuente: r.fuente,
        ok: r.ok,
        cantidad: r.cuotas.length,
        errorMessage: r.errorMessage ?? null,
        notas: r.notas ?? null,
      })),
    })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/admin/integridad/cuotas/[matchId]" })
  }
}
