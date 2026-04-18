import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

async function getUser() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const profile = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { nombre: true, apellido: true, email: true, clubFavorito: true, alertasCategorias: true },
  })
  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  return NextResponse.json({ profile })
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json()
  const { clubFavorito, alertasCategorias } = body

  await prisma.usuario.update({
    where: { id: user.id },
    data: {
      clubFavorito: clubFavorito ?? null,
      alertasCategorias: Array.isArray(alertasCategorias) ? JSON.stringify(alertasCategorias) : null,
    },
  })

  return NextResponse.json({ ok: true })
}
