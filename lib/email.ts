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
  type?: "success" | "error" | "info" | "warning"
}

function buildHtml({ body, nombre, ctaText, ctaUrl, type = "info" }: Omit<SendEmailParams, "to" | "subject">) {
  const greeting = nombre ? `Hola ${nombre},` : "Hola,"

  const accentColor = type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : type === "warning" ? "#d97706" : "#1e40af"
  const accentBg = type === "success" ? "#f0fdf4" : type === "error" ? "#fef2f2" : type === "warning" ? "#fffbeb" : "#eff6ff"
  const accentBorder = type === "success" ? "#bbf7d0" : type === "error" ? "#fecaca" : type === "warning" ? "#fde68a" : "#bfdbfe"

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

export async function emailCTHabilitado(to: string, nombre: string) {
  return sendEmail({
    to,
    subject: "Habilitación aprobada — Cuerpo Técnico CPB",
    nombre,
    type: "success",
    body: "Tu habilitación como miembro del Cuerpo Técnico de la CPB fue aprobada.<br><br>Ya podés acceder al portal con tu cuenta y ver tu carnet digital.",
    ctaText: "Ir al portal",
    ctaUrl: `${BASE_URL}/cuerpotecnico`,
  })
}

export async function emailCTRechazado(to: string, nombre: string, motivo: string) {
  return sendEmail({
    to,
    subject: "Habilitación rechazada — Cuerpo Técnico CPB",
    nombre,
    type: "error",
    body: `Tu solicitud de habilitación como Cuerpo Técnico fue revisada y necesita correcciones.<br><br><strong>Motivo:</strong> ${motivo}<br><br>Podés contactarnos a cpb@cpb.com.py para más información.`,
    ctaText: "Contactar",
    ctaUrl: `${BASE_URL}/contacto`,
  })
}

const DOC_LABELS: Record<string, string> = {
  comprobante: "Comprobante de transferencia bancaria",
  foto_carnet: "Foto tipo carnet",
  foto_cedula: "Foto de cédula de identidad",
}

export async function emailCTDocumentosRequeridos(to: string, nombre: string, documentos: string[], mensaje?: string) {
  const lista = documentos.map(d => `• ${DOC_LABELS[d] ?? d}`).join("<br>")
  const extra = mensaje ? `<br><br><strong>Mensaje de la CPB:</strong> ${mensaje}` : ""
  return sendEmail({
    to,
    subject: "Documentos requeridos — Cuerpo Técnico CPB",
    nombre,
    type: "warning",
    body: `La CPB necesita que actualices los siguientes documentos en el portal:<br><br>${lista}${extra}<br><br>Al ingresar a tu cuenta verás un aviso con las instrucciones para subir cada documento. Tu solicitud no podrá avanzar hasta completarlos.`,
    ctaText: "Ir al portal",
    ctaUrl: `${BASE_URL}/cuerpotecnico`,
  })
}

export async function emailCTAutoHabilitado(to: string, nombre: string) {
  return sendEmail({
    to,
    subject: "¡Bienvenido! Tu cuenta está activa — Cuerpo Técnico CPB",
    nombre,
    type: "success",
    body: "Tu registro fue procesado exitosamente. Como tu pago ya fue verificado previamente, tu cuenta está <strong>habilitada automáticamente</strong>.<br><br>Ya podés acceder al portal y ver tu carnet digital.",
    ctaText: "Ir al portal",
    ctaUrl: `${BASE_URL}/cuerpotecnico`,
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

export async function emailRolVerificadorAsignado(to: string, nombre: string) {
  return sendEmail({
    to,
    subject: "Fuiste asignado como Verificador — CPB Oficiales",
    nombre,
    type: "info",
    body: "La Confederación Paraguaya de Básquetbol te asignó el rol de <strong>Verificador</strong> en el portal CPB Oficiales.<br><br>Con este rol podés ingresar al panel de verificación y revisar las solicitudes de oficiales pendientes desde tu celular.<br><br>Lo encontrás en el menú lateral, sección <strong>Verificación</strong>.",
    ctaText: "Ir al panel de verificación",
    ctaUrl: `${BASE_URL}/oficiales/admin/usuarios?estado=PENDIENTE`,
  })
}

// ── Designaciones ────────────────────────────────────────

export interface DesignacionPartido {
  equipoLocal: string
  equipoVisit: string
  fecha: Date | string
  hora: string
  cancha: string | null
  categoria: string
  rol: string // "Crew Chief", "Auxiliar 1", etc.
}

export async function emailDesignacionConfirmada(
  to: string,
  nombre: string,
  partidos: DesignacionPartido[]
) {
  const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

  const fmtFecha = (f: Date | string) => {
    const d = typeof f === "string" ? new Date(f) : f
    return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
  }

  const esMultiple = partidos.length > 1
  const subject = esMultiple
    ? `Tenés ${partidos.length} designaciones confirmadas — CPB`
    : `Designación confirmada: ${partidos[0].equipoLocal} vs ${partidos[0].equipoVisit}`

  const tarjetas = partidos.map(p => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#1e3a5f;padding:10px 16px;">
          <p style="margin:0;color:#fff;font-weight:700;font-size:15px;">${p.equipoLocal} vs ${p.equipoVisit}</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">${p.categoria}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;background:#fff;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:3px 0;width:90px;font-size:12px;color:#6b7280;">Fecha</td>
              <td style="padding:3px 0;font-size:13px;color:#111827;font-weight:600;">${fmtFecha(p.fecha)}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:12px;color:#6b7280;">Hora</td>
              <td style="padding:3px 0;font-size:13px;color:#111827;font-weight:600;">${p.hora.slice(0, 5)} hs</td>
            </tr>
            ${p.cancha ? `<tr>
              <td style="padding:3px 0;font-size:12px;color:#6b7280;">Cancha</td>
              <td style="padding:3px 0;font-size:13px;color:#111827;font-weight:600;">${p.cancha}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:3px 0;font-size:12px;color:#6b7280;">Tu rol</td>
              <td style="padding:3px 0;">
                <span style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;">${p.rol}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join("")

  const intro = esMultiple
    ? `Tenés <strong>${partidos.length} designaciones confirmadas</strong> por la Confederación Paraguaya de Básquetbol:`
    : `Tu designación para el siguiente partido fue confirmada:`

  return sendEmail({
    to,
    subject,
    nombre,
    type: "success",
    body: `${intro}<br><br>${tarjetas}<br>Ingresá al portal para ver todos tus partidos asignados.`,
    ctaText: "Ver mis partidos",
    ctaUrl: `${BASE_URL}/oficiales/mis-partidos`,
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

// ─── INTEGRIDAD ──────────────────────────────────────────

const TIPO_DENUNCIA_LABEL: Record<string, string> = {
  MANIPULACION_RESULTADO: "Manipulación de resultado",
  ACTIVIDAD_APUESTAS: "Actividad de apuestas",
  SOBORNO_INCENTIVO: "Soborno o incentivo",
  CONDUCTA_SOSPECHOSA: "Conducta sospechosa",
  OTRA: "Otra situación",
}

interface DenunciaForEmail {
  id: string
  tipoSituacion: string
  competencia: string | null
  partidoEvento: string | null
  descripcion: string
  fechaOcurrencia: string | null
  personasInvolucradas: string | null
  tieneEvidencia: boolean
  modo: string
  contactoNombre: string | null
  contactoEmail: string | null
  contactoTelefono: string | null
  createdAt: Date
}

/** Notifica al admin sobre una nueva denuncia recibida en el canal. */
export async function emailDenunciaNueva(to: string, d: DenunciaForEmail) {
  const tipoLabel = TIPO_DENUNCIA_LABEL[d.tipoSituacion] ?? d.tipoSituacion
  const esAnonima = d.modo !== "identificado"
  const corto = d.descripcion.length > 400 ? d.descripcion.slice(0, 400) + "…" : d.descripcion

  const filas: string[] = []
  filas.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Tipo</td><td style="padding:6px 0;font-weight:600;">${tipoLabel}</td></tr>`)
  filas.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Modo</td><td style="padding:6px 0;font-weight:600;">${esAnonima ? "Anónima" : "Identificada"}</td></tr>`)
  if (d.competencia) filas.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Competencia</td><td style="padding:6px 0;">${d.competencia}</td></tr>`)
  if (d.partidoEvento) filas.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Partido</td><td style="padding:6px 0;">${d.partidoEvento}</td></tr>`)
  if (d.fechaOcurrencia) filas.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Fecha</td><td style="padding:6px 0;">${d.fechaOcurrencia}</td></tr>`)
  if (d.personasInvolucradas) filas.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Personas</td><td style="padding:6px 0;">${d.personasInvolucradas}</td></tr>`)
  if (d.tieneEvidencia) filas.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Evidencia</td><td style="padding:6px 0;">Adjunta — ver en el panel</td></tr>`)
  if (!esAnonima && d.contactoNombre) filas.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Contacto</td><td style="padding:6px 0;">${d.contactoNombre}${d.contactoEmail ? ` · <a href="mailto:${d.contactoEmail}">${d.contactoEmail}</a>` : ""}${d.contactoTelefono ? ` · ${d.contactoTelefono}` : ""}</td></tr>`)
  filas.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Recibida</td><td style="padding:6px 0;">${d.createdAt.toLocaleString("es-PY")}</td></tr>`)

  const body = `
    <p style="margin:0 0 12px;font-size:15px;color:#111827;font-weight:600;">Nueva denuncia ${esAnonima ? "anónima" : "identificada"}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:14px;">
      ${filas.join("")}
    </table>
    <p style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:600;">Descripción</p>
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${corto}</div>
  `

  return sendEmail({
    to,
    subject: `[CPB · Integridad] Nueva denuncia ${esAnonima ? "anónima" : ""} — ${tipoLabel}`,
    type: "warning",
    body,
    ctaText: "Ver en el panel",
    ctaUrl: `${BASE_URL}/oficiales/admin/denuncias`,
  })
}

interface AnalisisForEmail {
  matchId: string
  equipoLocal: string
  equipoLocalSigla: string | null
  equipoVisit: string
  equipoVisitSigla: string | null
  scoreLocal: number | null
  scoreVisit: number | null
  totalPuntos: number | null
  esCritico: boolean
  totalPatrones: number
  severidadMax: string | null
  aiSummary?: string | null
  patrones: Array<{
    tipoLabel: string
    severidad: string
    descripcion: string
  }>
}

/** Reporte automático tras analizar un partido: solo se envía si hay
 *  patrones detectados o si el partido es crítico (2 monitoreados). */
export async function emailIntegridadAnalisis(to: string, a: AnalisisForEmail) {
  const sevColor: Record<string, string> = {
    BAJO: "#6b7280", MEDIO: "#d97706", ALTO: "#ea580c", CRITICO: "#dc2626",
  }
  const sevLabel: Record<string, string> = {
    BAJO: "Bajo", MEDIO: "Medio", ALTO: "Alto", CRITICO: "Crítico",
  }

  const score = `${a.scoreLocal ?? "–"} : ${a.scoreVisit ?? "–"}`
  const localTag = a.equipoLocalSigla ? `${a.equipoLocal} (${a.equipoLocalSigla})` : a.equipoLocal
  const visitTag = a.equipoVisitSigla ? `${a.equipoVisit} (${a.equipoVisitSigla})` : a.equipoVisit

  const patronesHtml = a.patrones.length === 0
    ? `<p style="margin:0;color:#16a34a;font-size:14px;">No se detectaron patrones sospechosos.</p>`
    : a.patrones.map((p) => `
        <div style="background:#fff;border:1px solid #e5e7eb;border-left:3px solid ${sevColor[p.severidad] ?? "#6b7280"};border-radius:6px;padding:10px 12px;margin-bottom:8px;">
          <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${sevColor[p.severidad] ?? "#374151"};">
            ${p.tipoLabel} <span style="font-weight:400;color:#9ca3af;">· ${sevLabel[p.severidad] ?? p.severidad}</span>
          </p>
          <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.5;">${p.descripcion}</p>
        </div>
      `).join("")

  const subject = a.esCritico
    ? `[CPB · Integridad] PARTIDO CRÍTICO — ${localTag} vs ${visitTag}`
    : `[CPB · Integridad] ${a.totalPatrones} patrón${a.totalPatrones === 1 ? "" : "es"} — ${localTag} vs ${visitTag}`

  const type: "warning" | "error" = a.severidadMax === "CRITICO" || a.esCritico ? "error" : "warning"

  const aiSummaryHtml = a.aiSummary
    ? `
      <p style="margin:0 0 8px;color:#1e40af;font-size:13px;font-weight:600;">📋 Análisis experto</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:14px;font-size:14px;line-height:1.6;color:#1f2937;white-space:pre-wrap;">${a.aiSummary.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    `
    : ""

  const body = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;text-align:center;">
      ${localTag} <span style="color:#9ca3af;">${score}</span> ${visitTag}
    </p>
    ${a.esCritico ? `<p style="margin:0 0 12px;text-align:center;color:#dc2626;font-size:13px;font-weight:600;">⚠️ PARTIDO CRÍTICO — 2 clubes monitoreados</p>` : ""}
    ${aiSummaryHtml}
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;">
      Patrones detectados (${a.totalPatrones}) ${a.severidadMax ? `· severidad máx: ${sevLabel[a.severidadMax] ?? a.severidadMax}` : ""}
    </p>
    ${patronesHtml}
  `

  return sendEmail({
    to,
    subject,
    type,
    body,
    ctaText: "Ver análisis completo",
    ctaUrl: `${BASE_URL}/oficiales/admin/integridad`,
  })
}
