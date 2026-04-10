import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

// POST: official manually registers a game they participated in
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json()
    const { fecha, hora, equipoLocal, equipoVisit, cancha, ciudad, categoria, rol } = body

    if (!fecha || !hora || !equipoLocal || !equipoVisit || !categoria || !rol) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Create the partido
    const partido = await prisma.partido.create({
      data: {
        fecha,
        hora,
        equipoLocal,
        equipoVisit,
        cancha: cancha || "Por confirmar",
        ciudad: ciudad || "",
        categoria,
        descripcion: `manual:${user.id}`,
        creadoPor: user.id,
      },
    })

    // Create designacion with esManual=true
    const desig = await prisma.designacion.create({
      data: {
        partidoId: partido.id,
        usuarioId: user.id,
        rol,
        estado: "CONFIRMADA",
        asignadoPor: user.id,
        esManual: true,
      },
    })

    // Auto-generate honorario if arancel exists
    try {
      const arancel = await prisma.arancel.findUnique({
        where: { categoria_rol: { categoria: categoria as any, rol: rol as any } },
      })
      if (arancel) {
        const oficial = await prisma.usuario.findUnique({ where: { id: user.id }, select: { esEmpresa: true } })
        const aplicaIva = oficial?.esEmpresa ?? false
        const montoNeto  = Number(arancel.monto)
        const montoIva   = aplicaIva ? +(montoNeto * 0.10).toFixed(2) : 0
        const montoTotal = +(montoNeto + montoIva).toFixed(2)
        await prisma.honorario.upsert({
          where: { designacionId: desig.id },
          create: {
            designacionId: desig.id,
            partidoId: partido.id,
            usuarioId: user.id,
            monto: montoNeto,
            aplicaIva,
            montoIva: montoIva || null,
            montoTotal,
          },
          update: {},
        })
      }
    } catch (err) {
      console.error("[manual] honorario error:", err)
    }

    return NextResponse.json({ partido, designacion: desig })
  } catch (error) {
    return handleApiError(error, { context: "mis-partidos/manual" })
  }
}
