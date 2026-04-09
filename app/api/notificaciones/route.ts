import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getNotificaciones, getUnreadCount } from "@/lib/notifications"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const [notificaciones, unreadCount] = await Promise.all([
      getNotificaciones(session.user.id, limit, offset),
      getUnreadCount(session.user.id),
    ])

    return NextResponse.json({ notificaciones, unreadCount })
  } catch (error) {
    return handleApiError(error, { context: "notificaciones" })
  }
}
