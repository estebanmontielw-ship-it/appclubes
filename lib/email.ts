import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://appclubes.vercel.app"
const LOGO_URL = `${BASE_URL}/logo-cpb.jpg`

interface SendEmailParams {
  to: string
  subject: string
  body: string
  nombre?: string
  ctaText?: string
  ctaUrl?: string
  type?: "success" | "error" | "info"
}

function buildHtml({ body, nombre, ctaText, ctaUrl, type = "info" }: Omit<SendEmailParams, "to" | "subject">) {
  const greeting = nombre ? `Hola ${nombre},` : "Hola,"

  const accentColor = type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#1e40af"
  const accentBg = type === "success" ? "#f0fdf4" : type === "error" ? "#fef2f2" : "#eff6ff"
  const accentBorder = type === "success" ? "#bbf7d0" : type === "error" ? "#fecaca" : "#bfdbfe"

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#1e40af);padding:28px 32px;text-align:center;">
            <img src="${LOGO_URL}" alt="CPB" width="56" height="56" style="display:block;margin:0 auto 12px;border-radius:12px;" />
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">CPB Oficiales</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Confederación Paraguaya de Básquetbol</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:16px;color:#111827;font-weight:600;">${greeting}</p>

            <div style="background:${accentBg};border:1px solid ${accentBorder};border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">${body}</p>
            </div>

            ${ctaText && ctaUrl ? `
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 16px;">
                <a href="${ctaUrl}" style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">${ctaText}</a>
              </td></tr>
            </table>
            ` : ""}
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" /></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;text-align:center;">
            <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">CPB Oficiales — Portal de Oficiales de Básquetbol</p>
            <p style="margin:0;color:#d1d5db;font-size:11px;">Este es un email automático. No respondas a este mensaje.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendEmail(params: SendEmailParams) {
  if (!resend) {
    console.log(`[Email skip] No RESEND_API_KEY. To: ${params.to}, Subject: ${params.subject}`)
    return null
  }

  const html = buildHtml(params)

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "CPB Oficiales <onboarding@resend.dev>",
      to: params.to,
      subject: params.subject,
      html,
    })

    if (error) {
      console.error("[Email error]", error)
      return null
    }

    return data
  } catch (err) {
    console.error("[Email error]", err)
    return null
  }
}

// ─── Email templates ─────────────────────────────────────

export async function emailBienvenida(to: string, nombre: string) {
  return sendEmail({
    to,
    subject: "Bienvenido a CPB Oficiales",
    nombre,
    type: "info",
    body: "Tu solicitud de registro fue recibida correctamente. Nuestro equipo está revisando tu perfil y documentación.<br><br>Te vamos a notificar por email cuando tu cuenta sea verificada. Este proceso puede tomar entre 24 a 48 horas hábiles.",
    ctaText: "Ir al portal",
    ctaUrl: `${BASE_URL}/oficiales/login`,
  })
}

export async function emailBienvenidaCT(to: string, nombre: string) {
  return sendEmail({
    to,
    subject: "Bienvenido — Cuerpo Técnico CPB",
    nombre,
    type: "info",
    body: "Tu solicitud de registro en el portal de Cuerpo Técnico fue recibida correctamente.<br><br>Nuestro equipo está revisando tu perfil y documentación. Te vamos a notificar por email cuando tu cuenta sea verificada.",
    ctaText: "Ir al portal",
    ctaUrl: `${BASE_URL}/cuerpotecnico/login`,
  })
}

export async function emailCarnetVerificado(to: string, nombre: string) {
  return sendEmail({
    to,
    subject: "Tu perfil CPB fue verificado ✓",
    nombre,
    type: "success",
    body: "¡Tu solicitud fue aprobada! Ya podés acceder a todas las funcionalidades del portal:<br><br>• <strong>Carnet digital</strong> con código QR<br>• <strong>Cursos</strong> de capacitación<br>• <strong>Designaciones</strong> de partidos<br><br>Tu carnet digital ya está activo y podés descargarlo o compartirlo.",
    ctaText: "Ver mi carnet",
    ctaUrl: `${BASE_URL}/oficiales/carnet`,
  })
}

export async function emailCarnetRechazado(
  to: string,
  nombre: string,
  motivo: string
) {
  return sendEmail({
    to,
    subject: "Tu solicitud CPB necesita correcciones",
    nombre,
    type: "error",
    body: `Tu solicitud de verificación fue revisada y necesita correcciones.<br><br><strong>Motivo:</strong> ${motivo}<br><br>Podés actualizar tus documentos desde tu perfil y volver a solicitar la verificación.`,
    ctaText: "Actualizar mi perfil",
    ctaUrl: `${BASE_URL}/oficiales/perfil`,
  })
}

export async function emailPagoConfirmado(
  to: string,
  nombre: string,
  cursoNombre: string
) {
  return sendEmail({
    to,
    subject: "Pago confirmado — CPB Oficiales",
    nombre,
    type: "success",
    body: `Tu pago para el curso <strong>"${cursoNombre}"</strong> fue confirmado exitosamente.<br><br>¡Ya podés comenzar a estudiar! Ingresá al portal para acceder al contenido del curso.`,
    ctaText: "Comenzar el curso",
    ctaUrl: `${BASE_URL}/oficiales/cursos`,
  })
}

export async function emailPagoRechazado(
  to: string,
  nombre: string,
  cursoNombre: string,
  motivo: string
) {
  return sendEmail({
    to,
    subject: "Pago rechazado — CPB Oficiales",
    nombre,
    type: "error",
    body: `Tu pago para el curso <strong>"${cursoNombre}"</strong> fue revisado y no pudo ser confirmado.<br><br><strong>Motivo:</strong> ${motivo}<br><br>Podés volver a subir un comprobante válido desde la plataforma.`,
    ctaText: "Reintentar pago",
    ctaUrl: `${BASE_URL}/oficiales/cursos`,
  })
}
