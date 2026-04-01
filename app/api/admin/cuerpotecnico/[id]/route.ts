import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ct = await prisma.cuerpoTecnico.findUnique({
      where: { id: params.id },
    })
    if (!ct) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }
    return NextResponse.json({ ct })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { accion, motivoRechazo } = await request.json()

    let updateData: Record<string, unknown> = {}

    if (accion === "habilitar") {
      updateData = {
        estadoHabilitacion: "HABILITADO",
        periodoHabilitacion: new Date().getFullYear(),
        pagoVerificado: true,
        verificadoPor: user.id,
        verificadoEn: new Date(),
        motivoRechazo: null,
      }
    } else if (accion === "rechazar") {
      if (!motivoRechazo) {
        return NextResponse.json({ error: "Motivo requerido" }, { status: 400 })
      }
      updateData = {
        estadoHabilitacion: "RECHAZADO",
        verificadoPor: user.id,
        verificadoEn: new Date(),
        motivoRechazo,
      }
    } else if (accion === "suspender") {
      updateData = {
        estadoHabilitacion: "SUSPENDIDO",
        verificadoPor: user.id,
        verificadoEn: new Date(),
      }
    } else if (accion === "verificar_pago") {
      updateData = { pagoVerificado: true }
    }

    const ct = await prisma.cuerpoTecnico.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ ct })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
