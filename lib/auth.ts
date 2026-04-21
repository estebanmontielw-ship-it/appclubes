import { createServerClient } from "./supabase-server"
import prisma from "./prisma"
import type { TipoRol } from "@prisma/client"

export async function getSession() {
  const supabase = createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return { user }
}

export async function getCurrentUser() {
  const supabase = createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { roles: true },
  })

  return usuario
}

export async function getUserRoles(userId: string): Promise<TipoRol[]> {
  const roles = await prisma.usuarioRol.findMany({
    where: { usuarioId: userId },
    select: { rol: true },
  })
  return roles.map((r) => r.rol)
}

export function hasRole(userRoles: TipoRol[], requiredRole: TipoRol): boolean {
  return userRoles.includes(requiredRole)
}

export function hasAnyRole(userRoles: TipoRol[], requiredRoles: TipoRol[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role))
}

export function isAdmin(userRoles: TipoRol[]): boolean {
  return hasAnyRole(userRoles, ["SUPER_ADMIN", "INSTRUCTOR"] as TipoRol[])
}
