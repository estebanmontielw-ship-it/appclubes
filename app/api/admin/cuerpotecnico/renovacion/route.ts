import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// POST: Mass reset — block all CT members whose periodoHabilitacion < current year
// This should be called at the start of each new year (manually or via cron)
export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verify admin
    const admin = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { roles: true },
    })
    const isAdmin = admin?.roles.some(r => r.rol === "SUPER_ADMIN")
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const currentYear = new Date().getFullYear()

    // Block all habilitados whose period is from a previous year
    const result = await prisma.cuerpoTecnico.updateMany({
      where: {
        estadoHabilitacion: "HABILITADO",
        periodoHabilitacion: { lt: currentYear },
      },
      data: {
        estadoHabilitacion: "PENDIENTE",
        pagoVerificado: false,
        pagoAutoVerificado: false,
      },
    })

    return NextResponse.json({
      message: `Se bloquearon ${result.count} habilitaciones vencidas para renovación ${currentYear}`,
      bloqueados: result.count,
      periodo: currentYear,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
