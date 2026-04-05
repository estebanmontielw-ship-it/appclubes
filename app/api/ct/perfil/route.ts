import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json()
    const { fotoCarnetUrl, fotoCedulaUrl } = body

    const updateData: any = {}
    if (fotoCarnetUrl) updateData.fotoCarnetUrl = fotoCarnetUrl
    if (fotoCedulaUrl) updateData.fotoCedulaUrl = fotoCedulaUrl

    const ct = await prisma.cuerpoTecnico.update({
      where: { id: user.id },
      data: updateData,
    })

    return NextResponse.json({ ct })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
