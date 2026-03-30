import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/middleware"

export async function middleware(req: NextRequest) {
  const { supabase, response } = createClient(req)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  const isAuthRoute =
    pathname.startsWith("/oficiales/login") ||
    pathname.startsWith("/oficiales/registro") ||
    pathname.startsWith("/oficiales/recuperar") ||
    pathname.startsWith("/oficiales/verificar-email")
  const isPublicRoute = pathname.startsWith("/verificar")
  const isAdminRoute = pathname.startsWith("/oficiales/admin")
  const isCallbackRoute = pathname.startsWith("/api/auth/callback")

  // Public routes and callback — always allow
  if (isPublicRoute || isCallbackRoute) {
    return response
  }

  // No session and protected route → redirect to login
  if (!session && !isAuthRoute) {
    const redirectUrl = new URL("/oficiales/login", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Has session and on auth route → redirect to dashboard
  if (session && isAuthRoute) {
    const redirectUrl = new URL("/oficiales", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/oficiales/:path*", "/verificar/:path*"],
}
