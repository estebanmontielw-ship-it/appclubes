import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { loginSchema } from "@/lib/validations"

export async function POST(request: Request) {
  // Rate limit: 10 intentos por minuto por IP
  const rateLimitResponse = rateLimit(request, 10, 60_000, "login")
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()

    // Validar entrada con Zod
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Datos inválidos"
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { email, password } = parsed.data

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos" },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: data.user })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
