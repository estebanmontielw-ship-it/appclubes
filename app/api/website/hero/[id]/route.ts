import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

async function requireSuperAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
  })
  if (adminRoles.length === 0) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }
  return { user }
}

function clamp(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.max(0, Math.min(100, v))
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin()
    if ("error" in auth) return auth.error

    const body = await request.json()
    const existing = await prisma.heroImage.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const data: any = {}
    if (body.focalDesktopX !== undefined) data.focalDesktopX = clamp(body.focalDesktopX, existing.focalDesktopX)
    if (body.focalDesktopY !== undefined) data.focalDesktopY = clamp(body.focalDesktopY, existing.focalDesktopY)
    if (body.focalMobileX !== undefined) data.focalMobileX = clamp(body.focalMobileX, existing.focalMobileX)
    if (body.focalMobileY !== undefined) data.focalMobileY = clamp(body.focalMobileY, existing.focalMobileY)
    if (body.orden !== undefined) data.orden = Number(body.orden) || 0
    if (body.activo !== undefined) data.activo = Boolean(body.activo)
    if (body.imageUrl !== undefined) data.imageUrl = String(body.imageUrl)

    const image = await prisma.heroImage.update({ where: { id: params.id }, data })
    revalidatePath("/")
    return NextResponse.json({ image })
  } catch (error) {
    return handleApiError(error, { context: "website/hero/[id]" })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin()
    if ("error" in auth) return auth.error

    await prisma.heroImage.delete({ where: { id: params.id } })
    revalidatePath("/")
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, { context: "website/hero/[id]" })
  }
}
