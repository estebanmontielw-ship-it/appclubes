import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

interface SendEmailParams {
  to: string
  subject: string
  body: string
  nombre?: string
}

export async function sendEmail({ to, subject, body, nombre }: SendEmailParams) {
  if (!resend) {
    console.log(`[Email skip] No RESEND_API_KEY. To: ${to}, Subject: ${subject}`)
    return null
  }

  const greeting = nombre ? `Hola ${nombre},` : "Hola,"

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #f97316; color: white; display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 18px;">CPB</div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Confederación Paraguaya de Basketball</p>
      </div>
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px;">${greeting}</p>
        <p style="margin: 0; font-size: 15px; line-height: 1.6;">${body}</p>
      </div>
      <div style="text-align: center; color: #9ca3af; font-size: 12px;">
        <p>CPB Oficiales — Portal de Oficiales</p>
        <p>Este es un email automático, no respondas a este mensaje.</p>
      </div>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "CPB Oficiales <noreply@cpb.com.py>",
      to,
      subject,
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
    body: "Tu solicitud de registro fue recibida. Estamos revisando tu perfil y documentos. Te notificaremos cuando sea aprobado.",
  })
}

export async function emailCarnetVerificado(to: string, nombre: string) {
  return sendEmail({
    to,
    subject: "Tu perfil CPB fue verificado",
    nombre,
    body: "Tu solicitud fue aprobada. Ya podés acceder a tu carnet digital desde la plataforma.",
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
    body: `Tu solicitud fue rechazada por el siguiente motivo: <strong>${motivo}</strong>.<br><br>Podés actualizar tus documentos y volver a solicitar la verificación desde tu perfil.`,
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
    body: `Tu pago para el curso "<strong>${cursoNombre}</strong>" fue aprobado. Ingresá a la plataforma para comenzar.`,
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
    body: `Tu pago para el curso "<strong>${cursoNombre}</strong>" fue rechazado. Motivo: <strong>${motivo}</strong>.<br><br>Podés volver a subir el comprobante desde la plataforma.`,
  })
}
