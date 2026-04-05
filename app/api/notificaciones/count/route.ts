import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Lightweight endpoint for notification polling.
 * Returns only the unread count to minimize DB load.
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const unreadCount = await prisma.notificacion.count({
      where: { usuarioId: user.id, leido: false },
    })

    return NextResponse.json({ unreadCount })
  } catch {
    return NextResponse.json({ unreadCount: 0 })
  }
}
