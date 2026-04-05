import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { markAsRead, markAllAsRead } from "@/lib/notifications"
import { handleApiError } from "@/lib/api-errors"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { notifId, all } = await request.json()

    if (all) {
      await markAllAsRead(session.user.id)
    } else if (notifId) {
      await markAsRead(notifId, session.user.id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, { context: "notificaciones/read" })
  }
}
