import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const ALLOWED_CATEGORIAS = new Set(["lnb", "lnbf", "u22m", "u22f"])
const MAX_CLUB_LEN = 120

async function getUser() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const profile = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { nombre: true, apellido: true, email: true, avatarUrl: true, clubFavorito: true, alertasCategorias: true },
  })
  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  return NextResponse.json({ profile })
}

export async function PUT(request: Request) {
  const rateLimitResponse = rateLimit(request, 30, 60_000, "me-preferencias")
  if (rateLimitResponse) return rateLimitResponse

  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const clubFavorito = typeof body.clubFavorito === "string" && body.clubFavorito.length <= MAX_CLUB_LEN
    ? body.clubFavorito.trim() || null
    : null

  const alertasRaw = Array.isArray(body.alertasCategorias) ? body.alertasCategorias : []
  const alertasCategorias = alertasRaw
    .filter((c: unknown): c is string => typeof c === "string" && ALLOWED_CATEGORIAS.has(c))
    .slice(0, 10)

  // avatarUrl: only accept HTTPS URLs from our own Supabase storage
  const avatarUrl = typeof body.avatarUrl === "string" && body.avatarUrl.startsWith("https://")
    ? body.avatarUrl
    : body.avatarUrl === null ? null : undefined

  await prisma.usuario.update({
    where: { id: user.id },
    data: {
      clubFavorito,
      alertasCategorias: alertasCategorias.length ? JSON.stringify(alertasCategorias) : null,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}
