import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/middleware"

export async function middleware(req: NextRequest) {
  const { supabase, response } = createClient(req)

  // Refresh session — this is important for keeping cookies alive
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname

  const isOficialesAuthRoute =
    pathname.startsWith("/oficiales/login") ||
    pathname.startsWith("/oficiales/registro") ||
    pathname.startsWith("/oficiales/recuperar") ||
    pathname.startsWith("/oficiales/verificar-email")
  const isUnifiedAuthRoute =
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname.startsWith("/registro/")
  const isPublicRoute = pathname.startsWith("/verificar")
  const isApiRoute = pathname.startsWith("/api")
  const isMiCuenta = pathname.startsWith("/mi-cuenta")

  // Public routes and API routes — always allow
  if (isPublicRoute || isApiRoute) {
    return response
  }

  // Unified auth pages (/login, /registro/*) — if logged in, go home (client-side will whoami-redirect)
  if (isUnifiedAuthRoute && user) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // /mi-cuenta requires auth — redirect to unified login
  if (isMiCuenta && !user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Oficiales protected routes
  if (!isMiCuenta && !isUnifiedAuthRoute) {
    if (!user && !isOficialesAuthRoute) {
      return NextResponse.redirect(new URL("/oficiales/login", req.url))
    }
    if (user && isOficialesAuthRoute) {
      return NextResponse.redirect(new URL("/oficiales", req.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/oficiales/:path*",
    "/verificar/:path*",
    "/mi-cuenta/:path*",
    "/login",
    "/registro",
    "/registro/:path*",
  ],
}
