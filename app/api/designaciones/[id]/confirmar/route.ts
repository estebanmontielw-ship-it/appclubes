import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"
import { syncDesignaciones } from "@/lib/sync-designaciones"
import { emailDesignacionConfirmada } from "@/lib/email"
import admin from "firebase-admin"

export const dynamic = "force-dynamic"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"

if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    admin.initializeApp({ credential: admin.credential.cert(sa) })
  } catch {}
}

// POST: Confirm a planilla (BORRADOR → CONFIRMADA), notify officials
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const roles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: { in: ["SUPER_ADMIN", "DESIGNADOR"] } },
      include: { usuario: { select: { nombre: true, apellido: true } } },
    })
    if (roles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const designadorNombre = `${roles[0].usuario.nombre} ${roles[0].usuario.apellido}`

    const planilla = await prisma.planillaDesignacion.findUnique({ where: { id: params.id } })
    if (!planilla) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    if (planilla.estado === "CONFIRMADA") {
      return NextResponse.json({ error: "Ya está confirmada" }, { status: 400 })
    }

    // Validate required positions
    const required: { campo: string; label: string }[] = [
      { campo: "ccId", label: "Crew Chief" },
      { campo: "a1Id", label: "Auxiliar 1" },
      { campo: "apId", label: "Apuntador" },
      { campo: "cronId", label: "Cronómetro" },
      { campo: "lanzId", label: "Lanzamiento 24s" },
    ]
    const missing = required.filter(r => !(planilla as any)[r.campo]).map(r => r.label)
    if (missing.length > 0) {
      return NextResponse.json({
        error: `Faltan posiciones obligatorias: ${missing.join(", ")}`,
      }, { status: 400 })
    }

    const now = new Date()

    // Update planilla to CONFIRMADA
    const updated = await prisma.planillaDesignacion.update({
      where: { id: params.id },
      data: {
        estado: "CONFIRMADA",
        confirmadoPorId: user.id,
        confirmadoPorNombre: designadorNombre,
        confirmadaEn: now,
      },
    })

    // Audit log
    await prisma.planillaDesignacionLog.create({
      data: {
        planillaId: params.id,
        accion: "CONFIRMADA",
        campo: "estado",
        valorAnteriorNombre: "BORRADOR",
        valorNuevoNombre: "CONFIRMADA",
        cambiadoPorId: user.id,
        cambiadoPorNombre: designadorNombre,
      },
    })

    // Sync to Partido + Designacion tables
    await syncDesignaciones(updated, user.id, false)

    // Map each position to the assigned userId + role label
    const ROL_LABEL: Record<string, string> = {
      ccId: "Crew Chief", a1Id: "Auxiliar 1", a2Id: "Auxiliar 2",
      apId: "Apuntador", cronId: "Cronómetro", lanzId: "Lanzamiento 24s",
      estaId: "Estadístico", relaId: "Relator",
    }
    const asignaciones: { userId: string; rol: string }[] = []
    for (const [campo, label] of Object.entries(ROL_LABEL)) {
      const userId = (planilla as any)[campo] as string | null
      if (userId) asignaciones.push({ userId, rol: label })
    }
    const assignedIds = asignaciones.map(a => a.userId)

    // Send push notifications to assigned officials
    if (assignedIds.length > 0) {
      const tokens = await prisma.pushToken.findMany({
        where: { userId: { in: assignedIds } },
        select: { token: true, userId: true },
      })

      if (tokens.length > 0) {
        const fechaDisplay = planilla.fecha
          ? new Date(planilla.fecha).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit" })
          : ""
        const title = "Designación confirmada"
        const body = `${planilla.equipoLocal} vs ${planilla.equipoVisit} · ${fechaDisplay} ${planilla.horaStr}`
        const link = `${BASE_URL}/oficiales/mis-partidos`

        const tokenList = tokens.map(t => t.token)
        const failedTokens: string[] = []

        for (let i = 0; i < tokenList.length; i += 500) {
          const batch = tokenList.slice(i, i + 500)
          try {
            const response = await admin.messaging().sendEachForMulticast({
              tokens: batch,
              notification: { title, body },
              webpush: {
                notification: {
                  icon: `${BASE_URL}/favicon-cpb.png`,
                  badge: `${BASE_URL}/favicon-cpb.png`,
                },
                fcmOptions: { link },
              },
            })
            const INVALID_TOKEN_CODES = new Set([
              "messaging/registration-token-not-registered",
              "messaging/invalid-registration-token",
              "messaging/invalid-argument",
            ])
            response.responses.forEach((resp, idx) => {
              if (!resp.success && resp.error?.code && INVALID_TOKEN_CODES.has(resp.error.code)) {
                failedTokens.push(batch[idx])
              }
            })
          } catch (err) {
            console.error("FCM designacion batch error:", err)
          }
        }

        if (failedTokens.length > 0) {
          await prisma.pushToken.deleteMany({ where: { token: { in: failedTokens } } })
        }
      }
    }

    // Send emails — one per official, batching multiple roles for the same person
    if (assignedIds.length > 0) {
      const oficiales = await prisma.usuario.findMany({
        where: { id: { in: assignedIds } },
        select: { id: true, nombre: true, apellido: true, email: true },
      })

      // Group roles by userId (same person can have multiple roles)
      const rolesByUser = new Map<string, string[]>()
      for (const a of asignaciones) {
        const roles = rolesByUser.get(a.userId) || []
        roles.push(a.rol)
        rolesByUser.set(a.userId, roles)
      }

      const partidoBase = {
        equipoLocal: planilla.equipoLocal,
        equipoVisit: planilla.equipoVisit,
        fecha: planilla.fecha,
        hora: planilla.horaStr,
        cancha: planilla.cancha,
        categoria: planilla.categoria,
      }

      await Promise.allSettled(
        oficiales
          .filter(o => !!o.email)
          .map(o => {
            const roles = rolesByUser.get(o.id) || []
            // One entry per role (each becomes a "partido card" in the email)
            const partidos = roles.map(rol => ({ ...partidoBase, rol }))
            return emailDesignacionConfirmada(
              o.email!,
              `${o.nombre} ${o.apellido}`,
              partidos,
            )
          })
      )
    }

    return NextResponse.json({ planilla: updated })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/designaciones/[id]/confirmar" })
  }
}
