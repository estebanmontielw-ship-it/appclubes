import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { ROL_LABELS } from "@/lib/constants"
import { handleApiError } from "@/lib/api-errors"
import { generateCarnetPass } from "@/lib/apple-wallet"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { roles: true },
    })

    if (!usuario || usuario.estadoVerificacion !== "VERIFICADO" || !usuario.qrToken) {
      return NextResponse.json({ error: "Carnet no disponible" }, { status: 403 })
    }

    const rol = usuario.roles
      .map((r) => ROL_LABELS[r.rol] || r.rol)
      .join(" · ")

    const buffer = await generateCarnetPass({
      nombreCompleto: `${usuario.nombre} ${usuario.apellido}`.trim(),
      cedula: usuario.cedula || "—",
      rol: rol || "Oficial",
      ciudad: usuario.ciudad || "Paraguay",
      verificadoEn: usuario.verificadoEn || new Date(),
      qrToken: usuario.qrToken,
      serialNumber: usuario.id,
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="carnet-cpb.pkpass"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
