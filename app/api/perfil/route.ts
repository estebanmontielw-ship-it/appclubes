import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { telefono, ciudad, fotoCarnetUrl } = await request.json()

    const usuario = await prisma.usuario.update({
      where: { id: session.user.id },
      data: {
        ...(telefono && { telefono }),
        ...(ciudad && { ciudad }),
        ...(fotoCarnetUrl !== undefined && { fotoCarnetUrl }),
      },
      include: { roles: true },
    })

    return NextResponse.json({ usuario })
  } catch (error) {
    return handleApiError(error, { context: "perfil" })
  }
}
