import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

const ROL_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", INSTRUCTOR: "Instructor", DESIGNADOR: "Designador",
  VERIFICADOR: "Verificador", ARBITRO: "Árbitro", MESA: "Oficial de Mesa", ESTADISTICO: "Estadístico",
}

const CT_ROL_LABELS: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional", ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente", PREPARADOR_FISICO: "Preparador Físico", FISIO: "Fisioterapeuta", UTILERO: "Utilero",
}

function fmtCurrency(n: number) {
  return `Gs. ${n.toLocaleString("es-PY")}`
}

export async function GET() {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [
      totalUsuarios, verificados, pendientes, rechazados,
      hombres, mujeres,
      allUsuarios,
      allCT,
      cursosActivos, totalInscripciones, inscripcionesActivas,
      inscripcionesCompletadas, certificados,
      ingresosCursos, pagosPendientes, pagosConfirmados,
      honorariosPendientesSum, honorariosPagadosSum,
      totalPartidos, partidosProgramados, partidosFinalizados, totalDesignaciones,
      noticiasPublicadas, clubesActivos, seleccionesActivas, mensajesSinLeer,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { estadoVerificacion: "VERIFICADO" } }),
      prisma.usuario.count({ where: { estadoVerificacion: "PENDIENTE" } }),
      prisma.usuario.count({ where: { estadoVerificacion: "RECHAZADO" } }),
      prisma.usuario.count({ where: { genero: "Masculino" } }),
      prisma.usuario.count({ where: { genero: "Femenino" } }),
      prisma.usuario.findMany({
        select: { ciudad: true, roles: { select: { rol: true } } },
      }),
      prisma.cuerpoTecnico.findMany({
        where: { activo: true, estadoHabilitacion: { in: ["HABILITADO", "PENDIENTE"] } },
        select: { rol: true, estadoHabilitacion: true, pagoVerificado: true, montoHabilitacion: true, tieneTitulo: true },
      }),
      prisma.curso.count({ where: { estado: "ACTIVO" } }),
      prisma.inscripcion.count(),
      prisma.inscripcion.count({ where: { estado: "ACTIVO" } }),
      prisma.inscripcion.count({ where: { estado: "COMPLETADO" } }),
      prisma.certificado.count(),
      prisma.pago.aggregate({ where: { estado: "CONFIRMADO" }, _sum: { monto: true } }),
      prisma.pago.count({ where: { estado: "PENDIENTE_REVISION" } }),
      prisma.pago.count({ where: { estado: "CONFIRMADO" } }),
      prisma.honorario.aggregate({ where: { estado: "PENDIENTE" }, _sum: { monto: true } }),
      prisma.honorario.aggregate({ where: { estado: "PAGADO" }, _sum: { monto: true } }),
      prisma.partido.count(),
      prisma.partido.count({ where: { estado: "PROGRAMADO" } }),
      prisma.partido.count({ where: { estado: "FINALIZADO" } }),
      prisma.designacion.count(),
      prisma.noticia.count({ where: { publicada: true } }),
      prisma.club.count({ where: { activo: true } }),
      prisma.seleccion.count({ where: { activo: true } }),
      prisma.mensajeContacto.count({ where: { leido: false } }),
    ])

    // Roles distribution
    const roleCount: Record<string, number> = {}
    allUsuarios.forEach(u => u.roles.forEach(r => { roleCount[r.rol] = (roleCount[r.rol] || 0) + 1 }))

    // Top cities
    const cityCount: Record<string, number> = {}
    allUsuarios.forEach(u => { cityCount[u.ciudad] = (cityCount[u.ciudad] || 0) + 1 })
    const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 10)

    // CT stats
    const ctTotal = allCT.length
    const ctHabilitados = allCT.filter(m => m.estadoHabilitacion === "HABILITADO").length
    const ctPendientes = allCT.filter(m => m.estadoHabilitacion === "PENDIENTE").length
    const ctIngreso = allCT.filter(m => m.pagoVerificado).reduce((s, m) => s + Number(m.montoHabilitacion), 0)
    const ctConTitulo = allCT.filter(m => m.tieneTitulo).length

    const ctRoleCount: Record<string, number> = {}
    allCT.forEach(m => { ctRoleCount[m.rol] = (ctRoleCount[m.rol] || 0) + 1 })

    const fecha = new Date().toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric" })

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte CPB - ${fecha}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; max-width: 900px; margin: 0 auto; font-size: 13px; }
    @media print { body { padding: 20px; } .no-print { display: none; } @page { margin: 15mm; } }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; color: #374151; }
    .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    .print-btn { display: inline-block; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; cursor: pointer; border: none; font-size: 14px; margin-bottom: 24px; }
    .print-btn:hover { background: #1d4ed8; }
    .grid { display: grid; gap: 12px; margin-bottom: 16px; }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
    .kpi .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
    .kpi .value.sm { font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    th { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; background: #f9fafb; }
    td { font-size: 13px; }
    .bar-container { display: flex; align-items: center; gap: 8px; }
    .bar { height: 10px; background: #3b82f6; border-radius: 5px; min-width: 4px; }
    .bar.green { background: #10b981; }
    .bar.indigo { background: #6366f1; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Imprimir / Guardar como PDF</button>

  <h1>Reporte Estadístico CPB</h1>
  <p class="subtitle">Confederación Paraguaya de Básquetbol &mdash; Generado el ${fecha}</p>

  <h2>Oficiales</h2>
  <div class="grid grid-4">
    <div class="kpi"><div class="label">Total registrados</div><div class="value">${totalUsuarios}</div></div>
    <div class="kpi"><div class="label">Verificados</div><div class="value" style="color:#16a34a">${verificados}</div></div>
    <div class="kpi"><div class="label">Pendientes</div><div class="value" style="color:#ca8a04">${pendientes}</div></div>
    <div class="kpi"><div class="label">Rechazados</div><div class="value" style="color:#dc2626">${rechazados}</div></div>
  </div>
  <div class="grid grid-2">
    <div class="kpi"><div class="label">Masculino</div><div class="value">${hombres} <span style="font-size:13px;color:#6b7280">(${totalUsuarios > 0 ? Math.round((hombres / totalUsuarios) * 100) : 0}%)</span></div></div>
    <div class="kpi"><div class="label">Femenino</div><div class="value">${mujeres} <span style="font-size:13px;color:#6b7280">(${totalUsuarios > 0 ? Math.round((mujeres / totalUsuarios) * 100) : 0}%)</span></div></div>
  </div>

  <div class="grid grid-2">
    <div>
      <h3 style="font-size:13px;font-weight:600;margin-bottom:8px;">Distribución por rol</h3>
      <table>
        <tr><th>Rol</th><th style="text-align:right">Cantidad</th><th style="width:40%"></th></tr>
        ${Object.entries(roleCount).sort((a, b) => b[1] - a[1]).map(([rol, count]) => `
        <tr><td>${ROL_LABELS[rol] || rol}</td><td style="text-align:right;font-weight:700">${count}</td><td><div class="bar-container"><div class="bar" style="width:${Math.max((count / Math.max(...Object.values(roleCount), 1)) * 100, 3)}%"></div></div></td></tr>
        `).join("")}
      </table>
    </div>
    <div>
      <h3 style="font-size:13px;font-weight:600;margin-bottom:8px;">Top 10 ciudades</h3>
      <table>
        <tr><th>#</th><th>Ciudad</th><th style="text-align:right">Cantidad</th></tr>
        ${topCities.map(([city, count], i) => `
        <tr><td>${i + 1}</td><td>${city}</td><td style="text-align:right;font-weight:700">${count}</td></tr>
        `).join("")}
      </table>
    </div>
  </div>

  <h2>Cuerpo Técnico</h2>
  <div class="grid grid-4">
    <div class="kpi"><div class="label">Total</div><div class="value">${ctTotal}</div></div>
    <div class="kpi"><div class="label">Habilitados</div><div class="value" style="color:#16a34a">${ctHabilitados}</div></div>
    <div class="kpi"><div class="label">Pendientes</div><div class="value" style="color:#ca8a04">${ctPendientes}</div></div>
    <div class="kpi"><div class="label">Ingreso total</div><div class="value sm">${fmtCurrency(ctIngreso)}</div></div>
  </div>
  <div class="grid grid-2">
    <div>
      <table>
        <tr><th>Rol CT</th><th style="text-align:right">Cantidad</th></tr>
        ${Object.entries(ctRoleCount).sort((a, b) => b[1] - a[1]).map(([rol, count]) => `
        <tr><td>${CT_ROL_LABELS[rol] || rol}</td><td style="text-align:right;font-weight:700">${count}</td></tr>
        `).join("")}
      </table>
    </div>
    <div>
      <table>
        <tr><th>Dato</th><th style="text-align:right">Valor</th></tr>
        <tr><td>Con título habilitante</td><td style="text-align:right;font-weight:700">${ctConTitulo}</td></tr>
        <tr><td>Sin título</td><td style="text-align:right;font-weight:700">${ctTotal - ctConTitulo}</td></tr>
      </table>
    </div>
  </div>

  <h2>Cursos y Formación</h2>
  <div class="grid grid-3">
    <div class="kpi"><div class="label">Cursos activos</div><div class="value">${cursosActivos}</div></div>
    <div class="kpi"><div class="label">Total inscripciones</div><div class="value">${totalInscripciones}</div></div>
    <div class="kpi"><div class="label">Inscripciones activas</div><div class="value">${inscripcionesActivas}</div></div>
    <div class="kpi"><div class="label">Completadas</div><div class="value" style="color:#16a34a">${inscripcionesCompletadas}</div></div>
    <div class="kpi"><div class="label">Certificados emitidos</div><div class="value">${certificados}</div></div>
  </div>

  <h2>Finanzas</h2>
  <div class="grid grid-4">
    <div class="kpi"><div class="label">Ingresos cursos</div><div class="value sm" style="color:#16a34a">${fmtCurrency(Number(ingresosCursos._sum.monto || 0))}</div></div>
    <div class="kpi"><div class="label">Pagos confirmados</div><div class="value">${pagosConfirmados}</div></div>
    <div class="kpi"><div class="label">Pagos pendientes</div><div class="value" style="color:#ca8a04">${pagosPendientes}</div></div>
    <div class="kpi"><div class="label">Honorarios pagados</div><div class="value sm">${fmtCurrency(Number(honorariosPagadosSum._sum.monto || 0))}</div></div>
  </div>
  <div class="kpi" style="margin-top:8px;">
    <div class="label">Honorarios pendientes de pago</div>
    <div class="value" style="color:#ca8a04">${fmtCurrency(Number(honorariosPendientesSum._sum.monto || 0))}</div>
  </div>

  <h2>Partidos y Designaciones</h2>
  <div class="grid grid-4">
    <div class="kpi"><div class="label">Total partidos</div><div class="value">${totalPartidos}</div></div>
    <div class="kpi"><div class="label">Programados</div><div class="value">${partidosProgramados}</div></div>
    <div class="kpi"><div class="label">Finalizados</div><div class="value" style="color:#16a34a">${partidosFinalizados}</div></div>
    <div class="kpi"><div class="label">Total designaciones</div><div class="value">${totalDesignaciones}</div></div>
  </div>

  <h2>Sitio Web Público</h2>
  <div class="grid grid-4">
    <div class="kpi"><div class="label">Noticias publicadas</div><div class="value">${noticiasPublicadas}</div></div>
    <div class="kpi"><div class="label">Clubes activos</div><div class="value">${clubesActivos}</div></div>
    <div class="kpi"><div class="label">Selecciones</div><div class="value">${seleccionesActivas}</div></div>
    <div class="kpi"><div class="label">Mensajes sin leer</div><div class="value" style="color:#dc2626">${mensajesSinLeer}</div></div>
  </div>

  <div class="footer">
    Confederación Paraguaya de Básquetbol &mdash; Reporte generado automáticamente el ${fecha} &mdash; cpb.com.py
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    return handleApiError(error, { context: "admin/estadisticas/pdf" })
  }
}
