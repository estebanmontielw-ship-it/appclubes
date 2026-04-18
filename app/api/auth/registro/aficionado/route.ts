import { createServiceClient } from "@/lib/supabase"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { emailBienvenida } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"
import { handleApiError } from "@/lib/api-errors"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LEN = 120
const ALLOWED_CATEGORIAS = new Set(["lnb", "lnbf", "u22m", "u22f"])

export async function POST(request: Request) {
  const rateLimitResponse = rateLimit(request, 5, 60_000, "registro-aficionado")
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : ""
    const apellido = typeof body.apellido === "string" ? body.apellido.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const clubFavorito = typeof body.clubFavorito === "string" && body.clubFavorito.length <= MAX_LEN
      ? body.clubFavorito.trim() || null
      : null
    const alertasCategoriasRaw = Array.isArray(body.alertasCategorias) ? body.alertasCategorias : []
    const alertasCategorias = alertasCategoriasRaw
      .filter((c: unknown): c is string => typeof c === "string" && ALLOWED_CATEGORIAS.has(c))
      .slice(0, 10)

    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }
    if (nombre.length > MAX_LEN || apellido.length > MAX_LEN || email.length > MAX_LEN) {
      return NextResponse.json({ error: "Datos demasiado largos" }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      const msg = authError?.message || "Error al crear el usuario"
      if (msg.includes("already been registered") || msg.includes("already exists") || msg.includes("already registered")) {
        return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 })
      }
      if (msg.toLowerCase().includes("password")) {
        return NextResponse.json({ error: "La contraseña no cumple los requisitos mínimos" }, { status: 400 })
      }
      return NextResponse.json({ error: "No se pudo crear la cuenta. Intentá de nuevo." }, { status: 400 })
    }

    try {
      await prisma.usuario.create({
        data: {
          id: authData.user.id,
          email,
          nombre,
          apellido,
          estadoVerificacion: "VERIFICADO",
          clubFavorito,
          alertasCategorias: alertasCategorias.length ? JSON.stringify(alertasCategorias) : null,
          qrToken: uuidv4(),
          roles: { create: [{ rol: "AFICIONADO" }] },
        },
      })
    } catch (dbError) {
      // Rollback: Prisma failed, delete orphaned Supabase user so user can retry with same email
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
      throw dbError
    }

    emailBienvenida(email, nombre).catch(() => {})

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/auth/registro/aficionado" })
  }
}
