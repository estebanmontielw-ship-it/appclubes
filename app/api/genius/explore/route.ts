import { NextResponse } from "next/server"
import { geniusFetch, getCompetitions } from "@/lib/genius-sports"
import { requireRole, isAuthError } from "@/lib/api-auth"

/**
 * Admin-only endpoint to explore the Genius Sports API
 * GET /api/genius/explore?path=/competitions
 */
export async function GET(request: Request) {
  const auth = await requireRole("SUPER_ADMIN")
  if (isAuthError(auth)) return auth

  const { searchParams } = new URL(request.url)
  const path = searchParams.get("path")

  try {
    if (path) {
      // Fetch arbitrary path for exploration
      const data = await geniusFetch(path, "short")
      return NextResponse.json({ ok: true, path, data })
    }

    // Default: list competitions
    const data = await getCompetitions()
    return NextResponse.json({ ok: true, path: "/competitions", data })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}
