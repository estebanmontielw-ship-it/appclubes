import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json()
    const { fotoCarnetUrl, fotoCedulaUrl, comprobanteUrl, clearDocRequerido } = body

    const updateData: any = {}
    if (fotoCarnetUrl) updateData.fotoCarnetUrl = fotoCarnetUrl
    if (fotoCedulaUrl) updateData.fotoCedulaUrl = fotoCedulaUrl
    if (comprobanteUrl) updateData.comprobanteUrl = comprobanteUrl

    // Remove this specific doc from documentosRequeridos when uploaded
    if (clearDocRequerido) {
      const current = await prisma.cuerpoTecnico.findUnique({ where: { id: user.id }, select: { documentosRequeridos: true } })
      const lista: string[] = current?.documentosRequeridos ? JSON.parse(current.documentosRequeridos) : []
      const restante = lista.filter(d => d !== clearDocRequerido)
      updateData.documentosRequeridos = restante.length > 0 ? JSON.stringify(restante) : null
    }

    const ct = await prisma.cuerpoTecnico.update({
      where: { id: user.id },
      data: updateData,
    })

    return NextResponse.json({ ct })
  } catch (error) {
    return handleApiError(error, { context: "ct/perfil" })
  }
}
