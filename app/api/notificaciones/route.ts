import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getNotificaciones, getUnreadCount } from "@/lib/notifications"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { session },
    } = await supabase.auth.getSession()

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
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
