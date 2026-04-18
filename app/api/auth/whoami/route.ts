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

    // Check Usuario table first
    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { roles: true },
    })

    if (usuario) {
      const roles = usuario.roles.map(r => r.rol)
      if (roles.includes("AFICIONADO")) {
        return NextResponse.json({ type: "aficionado", redirect: "/mi-cuenta" })
      }
      return NextResponse.json({ type: "oficial", redirect: "/oficiales" })
    }

    // Check CuerpoTecnico table
    const ct = await prisma.cuerpoTecnico.findUnique({ where: { id: user.id } })
    if (ct) {
      return NextResponse.json({ type: "ct", redirect: "/cuerpotecnico" })
    }

    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
