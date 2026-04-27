import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { sendAdminPush } from "@/lib/admin-push"
import { handleApiError } from "@/lib/api-errors"

const TIPOS_VALIDOS = [
  "MANIPULACION_RESULTADO",
  "ACTIVIDAD_APUESTAS",
  "SOBORNO_INCENTIVO",
  "CONDUCTA_SOSPECHOSA",
  "OTRA",
] as const

type TipoSituacion = (typeof TIPOS_VALIDOS)[number]

function hashIp(ip: string): string {
  const salt = process.env.DENUNCIAS_IP_SALT || "cpb-denuncias-default-salt-change-me"
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const real = request.headers.get("x-real-ip")
  if (real) return real.trim()
  return "unknown"
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      tipoSituacion,
      competencia,
      partidoEvento,
      descripcion,
      fechaOcurrencia,
      personasInvolucradas,
      tieneEvidencia,
      descripcionEvidencia,
      archivosUrls,
      modo,
      contactoNombre,
      contactoEmail,
      contactoTelefono,
    } = body

    if (!tipoSituacion || !TIPOS_VALIDOS.includes(tipoSituacion as TipoSituacion)) {
      return NextResponse.json(
        { error: "Tipo de situación inválido" },
        { status: 400 }
      )
    }

    if (!descripcion || typeof descripcion !== "string" || descripcion.trim().length < 10) {
      return NextResponse.json(
        { error: "La descripción es obligatoria (mínimo 10 caracteres)" },
        { status: 400 }
      )
    }

    if (descripcion.length > 5000) {
      return NextResponse.json(
        { error: "La descripción no puede superar 5000 caracteres" },
        { status: 400 }
      )
    }

    const modoFinal = modo === "identificado" ? "identificado" : "anonimo"

    if (modoFinal === "identificado") {
      if (!contactoNombre || !contactoEmail) {
        return NextResponse.json(
          { error: "Si elegís identificarte, nombre y email son requeridos" },
          { status: 400 }
        )
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactoEmail)) {
        return NextResponse.json({ error: "Email inválido" }, { status: 400 })
      }
    }

    const ip = getClientIp(request)
    const ipHash = ip !== "unknown" ? hashIp(ip) : null
    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null

    // Anti-spam: bloquear si hay > 5 denuncias del mismo ipHash en las últimas 24 hs
    if (ipHash) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentCount = await prisma.denuncia.count({
        where: { ipHash, createdAt: { gte: since } },
      })
      if (recentCount >= 5) {
        return NextResponse.json(
          { error: "Demasiadas denuncias enviadas recientemente. Intentá más tarde." },
          { status: 429 }
        )
      }
    }

    const denuncia = await prisma.denuncia.create({
      data: {
        tipoSituacion: tipoSituacion as TipoSituacion,
        competencia: competencia?.toString().slice(0, 200) || null,
        partidoEvento: partidoEvento?.toString().slice(0, 300) || null,
        descripcion: descripcion.trim(),
        fechaOcurrencia: fechaOcurrencia?.toString().slice(0, 100) || null,
        personasInvolucradas: personasInvolucradas?.toString().slice(0, 1000) || null,
        tieneEvidencia: Boolean(tieneEvidencia),
        descripcionEvidencia: descripcionEvidencia?.toString().slice(0, 2000) || null,
        archivosUrls: Array.isArray(archivosUrls) && archivosUrls.length > 0
          ? JSON.stringify(archivosUrls.slice(0, 10))
          : null,
        modo: modoFinal,
        contactoNombre: modoFinal === "identificado" ? contactoNombre.toString().slice(0, 200) : null,
        contactoEmail: modoFinal === "identificado" ? contactoEmail.toString().slice(0, 200) : null,
        contactoTelefono: modoFinal === "identificado" ? contactoTelefono?.toString().slice(0, 50) || null : null,
        ipHash,
        userAgent,
      },
      select: { id: true, createdAt: true },
    })

    sendAdminPush(
      "Nueva denuncia recibida",
      `Canal de Integridad: ${tipoSituacion.replaceAll("_", " ")}`
    ).catch(() => {})

    return NextResponse.json({
      ok: true,
      id: denuncia.id,
      createdAt: denuncia.createdAt,
    })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/denuncias" })
  }
}
