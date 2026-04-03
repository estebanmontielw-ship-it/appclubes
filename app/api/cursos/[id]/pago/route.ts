import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { comprobanteUrl, referencia, notas, monto } = await request.json()

    if (!comprobanteUrl) {
      return NextResponse.json({ error: "Comprobante requerido" }, { status: 400 })
    }

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { usuarioId_cursoId: { usuarioId: session.user.id, cursoId: params.id } },
    })

    if (!inscripcion) {
      return NextResponse.json({ error: "No estás inscripto" }, { status: 400 })
    }

    if (inscripcion.estado !== "PENDIENTE_PAGO") {
      return NextResponse.json({ error: "Tu inscripción no requiere pago" }, { status: 400 })
    }

    const pago = await prisma.pago.create({
      data: {
        inscripcionId: inscripcion.id,
        monto: monto || 0,
        comprobanteUrl,
        referencia: referencia || null,
        notas: notas || null,
        estado: "PENDIENTE_REVISION",
      },
    })

    return NextResponse.json({ pago }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
