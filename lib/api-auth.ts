import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { TipoRol } from "@prisma/client"

interface AuthResult {
  user: { id: string; email?: string }
}

/**
 * Verifica que el request tiene un usuario autenticado.
 * @returns El usuario autenticado o un NextResponse 401
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  return { user: { id: user.id, email: user.email ?? undefined } }
}

/**
 * Verifica que el usuario autenticado tiene al menos uno de los roles requeridos.
 * @param requiredRoles - Roles que permiten acceso
 * @returns El usuario autenticado o un NextResponse 401/403
 */
export async function requireRole(
  ...requiredRoles: TipoRol[]
): Promise<AuthResult | NextResponse> {
  const authResult = await requireAuth()

  // Si es un NextResponse (error), retornarlo directamente
  if (authResult instanceof NextResponse) return authResult

  const userRoles = await prisma.usuarioRol.findMany({
    where: {
      usuarioId: authResult.user.id,
      rol: { in: requiredRoles },
    },
    select: { rol: true },
  })

  if (userRoles.length === 0) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  return authResult
}

/**
 * Helper para verificar si el resultado de auth es un error.
 */
export function isAuthError(
  result: AuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse
}
