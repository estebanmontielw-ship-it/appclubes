import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { sendAdminPush } from "@/lib/admin-push"
import { emailDenunciaNueva } from "@/lib/email"
import { handleApiError } from "@/lib/api-errors"

const INTEGRIDAD_NOTIFY_EMAIL = process.env.INTEGRIDAD_NOTIFY_EMAIL ?? "estebanmontielw@gmail.com"

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

/** Extrae geo del header de Vercel/Cloudflare. */
function getGeoFromHeaders(request: Request): {
  pais: string | null; region: string | null; ciudad: string | null; asn: string | null
} {
  const h = request.headers
  return {
    pais: h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? null,
    region: h.get("x-vercel-ip-country-region") ?? null,
    ciudad: h.get("x-vercel-ip-city") ?? h.get("cf-ipcity") ?? null,
    asn: h.get("x-vercel-ip-asn") ?? h.get("cf-ipasn") ?? null,
  }
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
    const ipReal = ip !== "unknown" ? ip : null
    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null
    const geo = getGeoFromHeaders(request)
    const referer = request.headers.get("referer")?.slice(0, 500) || null
    const acceptLanguage = request.headers.get("accept-language")?.slice(0, 200) || null

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

    // Datos forenses del cliente (capturados por el form)
    const browserFingerprint = typeof body.browserFingerprint === "string" ? body.browserFingerprint.slice(0, 200) : null
    const screenInfo = typeof body.screenInfo === "string" ? body.screenInfo.slice(0, 100) : null
    const timezone = typeof body.timezone === "string" ? body.timezone.slice(0, 100) : null
    const platform = typeof body.platform === "string" ? body.platform.slice(0, 100) : null
    const languages = typeof body.languages === "string" ? body.languages.slice(0, 200) : null
    const hardwareConcurrency = typeof body.hardwareConcurrency === "number" ? body.hardwareConcurrency : null
    const deviceMemory = typeof body.deviceMemory === "number" ? body.deviceMemory : null

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
        // Captura forense ampliada (cumple con disclaimer del form)
        ipReal,
        pais: geo.pais,
        region: geo.region,
        ciudad: geo.ciudad,
        asn: geo.asn,
        referer,
        acceptLanguage,
        browserFingerprint,
        screenInfo,
        timezone,
        platform,
        languages,
        hardwareConcurrency,
        deviceMemory,
      },
      select: { id: true, createdAt: true },
    })

    sendAdminPush(
      "Nueva denuncia recibida",
      `Canal de Integridad: ${tipoSituacion.replaceAll("_", " ")}`
    ).catch(() => {})

    // Email al admin (fire-and-forget — no bloquea respuesta)
    if (INTEGRIDAD_NOTIFY_EMAIL) {
      const denunciaParaEmail = await prisma.denuncia.findUnique({
        where: { id: denuncia.id },
      })
      if (denunciaParaEmail) {
        emailDenunciaNueva(INTEGRIDAD_NOTIFY_EMAIL, denunciaParaEmail).catch(() => {})
      }
    }

    return NextResponse.json({
      ok: true,
      id: denuncia.id,
      createdAt: denuncia.createdAt,
    })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/denuncias" })
  }
}
