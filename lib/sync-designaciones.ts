import prisma from "@/lib/prisma"
import admin from "firebase-admin"

if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    admin.initializeApp({ credential: admin.credential.cert(sa) })
  } catch {}
}

const ROL_MAP: Record<string, string> = {
  cc: "ARBITRO_PRINCIPAL", a1: "ARBITRO_ASISTENTE_1", a2: "ARBITRO_ASISTENTE_2",
  ap: "MESA_ANOTADOR", cron: "MESA_CRONOMETRADOR", lanz: "MESA_OPERADOR_24S",
  esta: "ESTADISTICO", rela: "MESA_ASISTENTE",
}

export async function syncDesignaciones(planilla: any, designadorId: string, isUpdate = false) {
  try {
    let partido = await prisma.partido.findFirst({
      where: { descripcion: `gs:${planilla.matchId}` },
    })

    if (!partido) {
      partido = await prisma.partido.create({
        data: {
          fecha: planilla.fecha,
          hora: planilla.horaStr,
          cancha: planilla.cancha || "Por confirmar",
          ciudad: "",
          categoria: "PRIMERA_DIVISION",
          equipoLocal: planilla.equipoLocal,
          equipoVisit: planilla.equipoVisit,
          descripcion: `gs:${planilla.matchId}`,
          creadoPor: designadorId,
        },
      })
    } else if (isUpdate) {
      await prisma.partido.update({
        where: { id: partido.id },
        data: {
          fecha: planilla.fecha,
          hora: planilla.horaStr,
          cancha: planilla.cancha || partido.cancha,
          equipoLocal: planilla.equipoLocal,
          equipoVisit: planilla.equipoVisit,
        },
      })
    }

    const positions = [
      { campo: "cc", userId: planilla.ccId },
      { campo: "a1", userId: planilla.a1Id },
      { campo: "a2", userId: planilla.a2Id },
      { campo: "ap", userId: planilla.apId },
      { campo: "cron", userId: planilla.cronId },
      { campo: "lanz", userId: planilla.lanzId },
      { campo: "esta", userId: planilla.estaId },
      { campo: "rela", userId: planilla.relaId },
    ].filter(p => p.userId)

    if (isUpdate) {
      await prisma.designacion.deleteMany({ where: { partidoId: partido.id } })
    }

    for (const { campo, userId } of positions) {
      if (!userId) continue
      const usuarioExiste = await prisma.usuario.findUnique({ where: { id: userId }, select: { id: true } })
      if (!usuarioExiste) continue

      const rol = ROL_MAP[campo] as any

      // Search by rol too — same person can have multiple roles in the same game
      const existing = await prisma.designacion.findFirst({
        where: { partidoId: partido.id, usuarioId: userId, rol },
      })

      if (existing) {
        await prisma.designacion.update({
          where: { id: existing.id },
          data: { asignadoPor: designadorId, estado: "CONFIRMADA" },
        })
      } else {
        await prisma.designacion.create({
          data: {
            partidoId: partido.id, usuarioId: userId,
            rol, estado: "CONFIRMADA", asignadoPor: designadorId,
          },
        })
      }
    }

    return partido
  } catch (e) {
    console.error("syncDesignaciones error:", e)
    return null
  }
}
