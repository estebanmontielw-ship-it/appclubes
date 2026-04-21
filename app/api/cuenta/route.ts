import { createClient } from "@/utils/supabase/server"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"

export async function DELETE() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Delete Prisma record first (cascade handles roles, notificaciones, etc.)
    await prisma.usuario.delete({ where: { id: user.id } }).catch(() => {
      // If cascade fails, continue — the auth deletion still invalidates access
    })

    // Delete from Supabase Auth (requires service role)
    const serviceClient = createServiceClient()
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return NextResponse.json({ error: "No se pudo eliminar la cuenta" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, { context: "DELETE /api/cuenta" })
  }
}
