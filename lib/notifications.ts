import prisma from "./prisma"
import type { TipoNotificacion } from "@prisma/client"

interface CreateNotifParams {
  usuarioId: string
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  link?: string
  enviadoPor?: string
}

export async function createNotificacion(params: CreateNotifParams) {
  return prisma.notificacion.create({
    data: {
      usuarioId: params.usuarioId,
      tipo: params.tipo,
      titulo: params.titulo,
      mensaje: params.mensaje,
      link: params.link || null,
      enviadoPor: params.enviadoPor || null,
    },
  })
}

export async function getUnreadCount(usuarioId: string): Promise<number> {
  return prisma.notificacion.count({
    where: { usuarioId, leido: false },
  })
}

export async function getNotificaciones(
  usuarioId: string,
  limit = 20,
  offset = 0
) {
  return prisma.notificacion.findMany({
    where: { usuarioId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  })
}

export async function markAsRead(notifId: string, usuarioId: string) {
  return prisma.notificacion.updateMany({
    where: { id: notifId, usuarioId },
    data: { leido: true, leidoEn: new Date() },
  })
}

export async function markAllAsRead(usuarioId: string) {
  return prisma.notificacion.updateMany({
    where: { usuarioId, leido: false },
    data: { leido: true, leidoEn: new Date() },
  })
}

// ─── Notificaciones específicas por evento ───────────────

export async function notifCarnetVerificado(usuarioId: string) {
  return createNotificacion({
    usuarioId,
    tipo: "CARNET_VERIFICADO",
    titulo: "Tu perfil fue verificado",
    mensaje:
      "Tu carnet digital ya está activo. Podés descargarlo y compartirlo.",
    link: "/oficiales/carnet",
  })
}

export async function notifCarnetRechazado(
  usuarioId: string,
  motivo: string
) {
  return createNotificacion({
    usuarioId,
    tipo: "CARNET_RECHAZADO",
    titulo: "Tu perfil fue rechazado",
    mensaje: `Motivo: ${motivo}. Podés actualizar tus documentos y volver a solicitar verificación.`,
    link: "/oficiales/perfil",
  })
}

export async function notifPagoConfirmado(
  usuarioId: string,
  cursoNombre: string
) {
  return createNotificacion({
    usuarioId,
    tipo: "PAGO_CONFIRMADO",
    titulo: "Pago confirmado",
    mensaje: `Tu pago para el curso "${cursoNombre}" fue confirmado. Ya podés comenzar.`,
    link: "/oficiales/cursos",
  })
}

export async function notifPagoRechazado(
  usuarioId: string,
  cursoNombre: string,
  motivo: string
) {
  return createNotificacion({
    usuarioId,
    tipo: "PAGO_RECHAZADO",
    titulo: "Pago rechazado",
    mensaje: `Tu pago para "${cursoNombre}" fue rechazado. Motivo: ${motivo}`,
    link: "/oficiales/cursos",
  })
}

export async function notifCertificadoEmitido(
  usuarioId: string,
  cursoNombre: string
) {
  return createNotificacion({
    usuarioId,
    tipo: "CERTIFICADO_EMITIDO",
    titulo: "Certificado emitido",
    mensaje: `Completaste el curso "${cursoNombre}". Tu certificado ya está disponible.`,
    link: "/oficiales/cursos",
  })
}

export async function notifDesignacionAsignada(
  usuarioId: string,
  partido: string,
  rol: string
) {
  return createNotificacion({
    usuarioId,
    tipo: "DESIGNACION_ASIGNADA",
    titulo: "Nueva designación",
    mensaje: `Fuiste designado como ${rol} para ${partido}.`,
    link: "/oficiales/mis-partidos",
  })
}

export async function notifMensajeAdmin(
  usuarioId: string,
  titulo: string,
  mensaje: string,
  enviadoPor: string
) {
  return createNotificacion({
    usuarioId,
    tipo: "MENSAJE_ADMIN",
    titulo,
    mensaje,
    enviadoPor,
  })
}
