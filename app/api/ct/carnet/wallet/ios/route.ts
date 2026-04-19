import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"
import { generateCarnetPass } from "@/lib/apple-wallet"

export const dynamic = "force-dynamic"

const ROL_CT_LABELS: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
  NUTRICIONISTA: "Nutricionista",
}

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const ct = await prisma.cuerpoTecnico.findUnique({
      where: { email: user.email },
    })

    if (!ct || ct.estadoHabilitacion !== "HABILITADO" || !ct.qrToken) {
      return NextResponse.json({ error: "Carnet no disponible" }, { status: 403 })
    }

    const rol = ROL_CT_LABELS[ct.rol] || ct.rol

    const buffer = await generateCarnetPass({
      nombreCompleto: `${ct.nombre} ${ct.apellido}`.trim(),
      cedula: ct.cedula || "—",
      rol,
      ciudad: ct.ciudad || "Paraguay",
      verificadoEn: ct.verificadoEn || new Date(),
      qrToken: ct.qrToken,
      serialNumber: `ct-${ct.id}`,
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="carnet-ct-cpb.pkpass"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
