import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { emailCTHabilitado, emailCTRechazado, emailCTDocumentosRequeridos } from "@/lib/email"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const ct = await prisma.cuerpoTecnico.findUnique({
      where: { id: params.id },
    })
    if (!ct) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }
    return NextResponse.json({ ct })
  } catch (error) {
    return handleApiError(error, { context: "admin/cuerpotecnico/[id]" })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { accion, motivoRechazo, editar, documentos, mensaje } = body

    // Edit mode - update any field
    if (editar) {
      const allowedFields = ["nombre", "apellido", "cedula", "telefono", "ciudad", "email", "genero", "nacionalidad", "rol", "razonSocial", "ruc", "tieneTitulo", "fotoCarnetUrl", "fotoCedulaUrl", "comprobanteUrl"]
      const updateData: Record<string, unknown> = {}
      for (const field of allowedFields) {
        if (editar[field] !== undefined) updateData[field] = editar[field]
      }
      if (editar.fechaNacimiento) {
        updateData.fechaNacimiento = new Date(editar.fechaNacimiento)
      }
      const ct = await prisma.cuerpoTecnico.update({
        where: { id: params.id },
        data: updateData,
      })
      return NextResponse.json({ ct })
    }

    let updateData: Record<string, unknown> = {}

    if (accion === "habilitar") {
      updateData = {
        estadoHabilitacion: "HABILITADO",
        pagoVerificado: true,
        verificadoPor: user.id,
        verificadoEn: new Date(),
        motivoRechazo: null,
      }
    } else if (accion === "rechazar") {
      if (!motivoRechazo) {
        return NextResponse.json({ error: "Motivo requerido" }, { status: 400 })
      }
      updateData = {
        estadoHabilitacion: "RECHAZADO",
        verificadoPor: user.id,
        verificadoEn: new Date(),
        motivoRechazo,
      }
    } else if (accion === "suspender") {
      updateData = {
        estadoHabilitacion: "SUSPENDIDO",
        verificadoPor: user.id,
        verificadoEn: new Date(),
      }
    } else if (accion === "verificar_pago") {
      updateData = { pagoVerificado: true }
    } else if (accion === "eliminar") {
      updateData = { activo: false }
    } else if (accion === "restaurar") {
      updateData = { activo: true }
    } else if (accion === "notificar_documentos") {
      if (!documentos?.length) {
        return NextResponse.json({ error: "Seleccioná al menos un documento" }, { status: 400 })
      }
      updateData = {
        documentosRequeridos: JSON.stringify(documentos),
        mensajeDocumentos: mensaje || null,
      }
    }

    const ct = await prisma.cuerpoTecnico.update({
      where: { id: params.id },
      data: updateData,
    })

    // Send email notifications
    if (accion === "habilitar") {
      emailCTHabilitado(ct.email, ct.nombre).catch(() => {})
    } else if (accion === "rechazar" && motivoRechazo) {
      emailCTRechazado(ct.email, ct.nombre, motivoRechazo).catch(() => {})
    } else if (accion === "notificar_documentos") {
      emailCTDocumentosRequeridos(ct.email, ct.nombre, documentos, mensaje).catch(() => {})
    }

    return NextResponse.json({ ct })
  } catch (error) {
    return handleApiError(error, { context: "admin/cuerpotecnico/[id]" })
  }
}
