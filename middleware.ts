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

  const isAuthRoute =
    pathname.startsWith("/oficiales/login") ||
    pathname.startsWith("/oficiales/registro") ||
    pathname.startsWith("/oficiales/recuperar") ||
    pathname.startsWith("/oficiales/verificar-email")
  const isPublicRoute = pathname.startsWith("/verificar")
  const isApiRoute = pathname.startsWith("/api")

  // Public routes and API routes — always allow
  if (isPublicRoute || isApiRoute) {
    return response
  }

  // No user and protected route → redirect to login
  if (!user && !isAuthRoute) {
    const redirectUrl = new URL("/oficiales/login", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Has user and on auth route → redirect to dashboard
  if (user && isAuthRoute) {
    const redirectUrl = new URL("/oficiales", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/oficiales/:path*", "/verificar/:path*"],
}
