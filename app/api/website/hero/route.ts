import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

const MAX_HERO_IMAGES = 5

export async function GET() {
  try {
    const images = await prisma.heroImage.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json(
      { images },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (error) {
    return handleApiError(error, { context: "website/hero" })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { imageUrl, focalDesktopX, focalDesktopY, focalMobileX, focalMobileY } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "Falta imageUrl" }, { status: 400 })
    }

    const count = await prisma.heroImage.count({ where: { activo: true } })
    if (count >= MAX_HERO_IMAGES) {
      return NextResponse.json(
        { error: `Límite de ${MAX_HERO_IMAGES} imágenes alcanzado. Eliminá una antes de agregar otra.` },
        { status: 400 }
      )
    }

    const image = await prisma.heroImage.create({
      data: {
        imageUrl,
        focalDesktopX: clamp(focalDesktopX, 50),
        focalDesktopY: clamp(focalDesktopY, 50),
        focalMobileX: clamp(focalMobileX, 50),
        focalMobileY: clamp(focalMobileY, 50),
        orden: count,
      },
    })

    revalidatePath("/")
    return NextResponse.json({ image }, { status: 201 })
  } catch (error) {
    return handleApiError(error, { context: "website/hero" })
  }
}

function clamp(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.max(0, Math.min(100, v))
}
