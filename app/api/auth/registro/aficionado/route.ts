import { createServiceClient } from "@/lib/supabase"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { emailBienvenida } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"
import { handleApiError } from "@/lib/api-errors"

export async function POST(request: Request) {
  const rateLimitResponse = rateLimit(request, 5, 60_000, "registro-aficionado")
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { nombre, apellido, email, password, clubFavorito, alertasCategorias } = body

    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      const msg = authError?.message || "Error al crear el usuario"
      if (msg.includes("already been registered") || msg.includes("already exists")) {
        return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 })
      }
      return NextResponse.json({ error: `Error al crear cuenta: ${msg}` }, { status: 400 })
    }

    await prisma.usuario.create({
      data: {
        id: authData.user.id,
        email,
        nombre,
        apellido,
        estadoVerificacion: "VERIFICADO",
        clubFavorito: clubFavorito || null,
        alertasCategorias: alertasCategorias ? JSON.stringify(alertasCategorias) : null,
        qrToken: uuidv4(),
        roles: { create: [{ rol: "AFICIONADO" }] },
      },
    })

    emailBienvenida(email, nombre).catch(() => {})

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/auth/registro/aficionado" })
  }
}
