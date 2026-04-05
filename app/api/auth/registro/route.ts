import { createServiceClient } from "@/lib/supabase"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import type { TipoRol } from "@prisma/client"
import { emailBienvenida } from "@/lib/email"
import { sendAdminPush } from "@/lib/admin-push"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // Rate limit: 5 registros por minuto por IP
  const rateLimitResponse = rateLimit(request, 5, 60_000, "registro")
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const {
      nombre,
      apellido,
      cedula,
      fechaNacimiento,
      telefono,
      ciudad,
      barrio,
      genero,
      email,
      password,
      roles,
      fotoCedulaUrl,
      fotoCarnetUrl,
    } = body

    // Validate required fields
    if (!nombre || !apellido || !cedula || !email || !password || !roles?.length) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Check if cedula already exists
    const existingCedula = await prisma.usuario.findUnique({
      where: { cedula },
    })
    if (existingCedula) {
      return NextResponse.json(
        { error: "Ya existe un usuario con esa cédula" },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const supabase = createServiceClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con ese email" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Error al crear el usuario" },
        { status: 500 }
      )
    }

    // Generate QR token
    const qrToken = uuidv4()

    // Create user in our DB
    const usuario = await prisma.usuario.create({
      data: {
        id: authData.user.id,
        email,
        nombre,
        apellido,
        cedula,
        fechaNacimiento: new Date(fechaNacimiento),
        telefono,
        ciudad,
        barrio: barrio || null,
        genero: genero || "Masculino",
        fotoCedulaUrl: fotoCedulaUrl || null,
        fotoCarnetUrl: fotoCarnetUrl || null,
        qrToken,
        estadoVerificacion: "PENDIENTE",
        roles: {
          create: (roles as TipoRol[]).map((rol) => ({ rol })),
        },
      },
      include: { roles: true },
    })

    // Send welcome email (fire and forget)
    emailBienvenida(email, nombre).catch(() => {})

    // Notify admin
    sendAdminPush("Nuevo oficial registrado", `${nombre} ${apellido} se registró como oficial`).catch(() => {})

    return NextResponse.json({ usuario }, { status: 201 })
  } catch (error: unknown) {
    console.error("Error en registro:", error)
    const message = error instanceof Error ? error.message : "Error interno del servidor"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
