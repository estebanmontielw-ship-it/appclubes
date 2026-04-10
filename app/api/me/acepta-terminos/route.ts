import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const ahora = new Date()

  // Try Usuario first
  const usuario = await prisma.usuario.findUnique({ where: { id: user.id } })
  if (usuario) {
    await prisma.usuario.update({ where: { id: user.id }, data: { aceptoTerminosEn: ahora } })
    return NextResponse.json({ ok: true })
  }

  // Try CuerpoTecnico
  const ct = await prisma.cuerpoTecnico.findFirst({ where: { email: user.email! } })
  if (ct) {
    await prisma.cuerpoTecnico.update({ where: { id: ct.id }, data: { aceptoTerminosEn: ahora } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
}
