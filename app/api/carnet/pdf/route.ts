import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { generateQRDataURL } from "@/lib/qr"
import { ROL_LABELS } from "@/lib/constants"
import { handleApiError } from "@/lib/api-errors"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      include: { roles: true },
    })

    if (!usuario || usuario.estadoVerificacion !== "VERIFICADO") {
      return NextResponse.json(
        { error: "Carnet no disponible" },
        { status: 403 }
      )
    }

    // Generate QR
    const qrDataUrl = usuario.qrToken
      ? await generateQRDataURL(usuario.qrToken)
      : ""

    const roles = usuario.roles
      .map((r) => ROL_LABELS[r.rol] || r.rol)
      .join(" | ")

    const verificadoFecha = usuario.verificadoEn
      ? new Date(usuario.verificadoEn).toLocaleDateString("es-PY", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : ""

    // Build HTML for the PDF-like carnet
    // We return an HTML page that the client can print/save as PDF
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Carnet CPB — ${usuario.nombre} ${usuario.apellido}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
  .card { width: 380px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
  .logo { background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 8px; color: white; font-weight: bold; font-size: 14px; }
  .header-text { color: white; }
  .header-text h1 { font-size: 13px; font-weight: 600; }
  .header-text p { font-size: 10px; opacity: 0.8; }
  .body { padding: 24px; }
  .info-row { display: flex; gap: 16px; margin-bottom: 16px; }
  .photo { width: 90px; height: 110px; border-radius: 8px; object-fit: cover; border: 2px solid #e5e7eb; flex-shrink: 0; }
  .photo-placeholder { width: 90px; height: 110px; border-radius: 8px; background: #e5e7eb; flex-shrink: 0; }
  .details { flex: 1; }
  .name { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
  .ci { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
  .roles { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
  .role-badge { background: #dbeafe; color: #1d4ed8; font-size: 10px; padding: 3px 10px; border-radius: 12px; font-weight: 600; }
  .city { font-size: 11px; color: #6b7280; }
  .verified { display: flex; align-items: center; gap: 6px; color: #16a34a; font-size: 11px; font-weight: 500; margin-top: 6px; }
  .verified-dot { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; }
  .qr-section { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  .qr-img { width: 160px; height: 160px; }
  .qr-text { font-size: 9px; color: #9ca3af; margin-top: 6px; }
  .footer { text-align: center; padding: 12px; border-top: 1px solid #e5e7eb; }
  .footer p { font-size: 9px; color: #9ca3af; }
  @media print {
    body { background: white; }
    .card { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <img src="${process.env.NEXT_PUBLIC_BASE_URL}/logo-cpb.jpg" alt="CPB" style="height:36px;width:36px;object-fit:contain;" />
    <div class="header-text">
      <h1>CARNET OFICIAL CPB</h1>
      <p>Confederación Paraguaya de Básquetbol</p>
    </div>
  </div>
  <div class="body">
    <div class="info-row">
      ${
        usuario.fotoCarnetUrl
          ? `<img src="${usuario.fotoCarnetUrl}" alt="Foto" class="photo" />`
          : '<div class="photo-placeholder"></div>'
      }
      <div class="details">
        <p class="name">${usuario.nombre} ${usuario.apellido}</p>
        <p class="ci">CI: ${usuario.cedula}</p>
        <div class="roles">
          ${usuario.roles
            .map(
              (r) =>
                `<span class="role-badge">${ROL_LABELS[r.rol] || r.rol}</span>`
            )
            .join("")}
        </div>
        <p class="city">${usuario.ciudad}, Paraguay</p>
        <div class="verified">
          <span class="verified-dot"></span>
          Verificado${verificadoFecha ? ` — ${verificadoFecha}` : ""}
        </div>
      </div>
    </div>
    ${
      qrDataUrl
        ? `<div class="qr-section">
        <img src="${qrDataUrl}" alt="QR" class="qr-img" />
        <p class="qr-text">Escaneá el QR para verificar este carnet</p>
      </div>`
        : ""
    }
  </div>
  <div class="footer">
    <p>Portal CPB Oficiales — cpb.com.py/oficiales</p>
  </div>
</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="carnet-cpb-${usuario.cedula}.html"`,
      },
    })
  } catch (error) {
    return handleApiError(error, { context: "carnet/pdf" })
  }
}
