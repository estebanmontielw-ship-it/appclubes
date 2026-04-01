import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const ct = await prisma.cuerpoTecnico.findUnique({
      where: { id: user.id },
    })

    if (!ct) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    // Check if habilitación is expired (new year started)
    const currentYear = new Date().getFullYear()
    const habilitacionVencida = ct.estadoHabilitacion === "HABILITADO" && ct.periodoHabilitacion < currentYear

    return NextResponse.json({ ct, habilitacionVencida, periodoActual: currentYear })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
