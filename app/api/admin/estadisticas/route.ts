import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireRole, isAuthError } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    if (isAuthError(auth)) return auth

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [
      // Oficiales
      totalUsuarios,
      verificados,
      pendientes,
      rechazados,
      hombresOficiales,
      mujeresOficiales,
      allUsuarios,
      // Cuerpo Técnico
      allCT,
      // Cursos
      cursosActivos,
      cursosBorrador,
      totalInscripciones,
      inscripcionesActivas,
      inscripcionesCompletadas,
      certificadosEmitidos,
      // Finanzas cursos
      ingresosCursos,
      pagosPendientes,
      pagosConfirmados,
      pagosRecientes,
      // Partidos
      totalPartidos,
      partidosProgramados,
      partidosFinalizados,
      totalDesignaciones,
      // Honorarios
      honorariosPendientesSum,
      honorariosPagadosSum,
      // Website
      noticiasPublicadas,
      clubesActivos,
      seleccionesActivas,
      mensajesSinLeer,
      // Registros por mes
      usuariosPorMes,
    ] = await Promise.all([
      // Oficiales
      prisma.usuario.count(),
      prisma.usuario.count({ where: { estadoVerificacion: "VERIFICADO" } }),
      prisma.usuario.count({ where: { estadoVerificacion: "PENDIENTE" } }),
      prisma.usuario.count({ where: { estadoVerificacion: "RECHAZADO" } }),
      prisma.usuario.count({ where: { genero: "Masculino" } }),
      prisma.usuario.count({ where: { genero: "Femenino" } }),
      prisma.usuario.findMany({
        select: {
          ciudad: true,
          fechaNacimiento: true,
          roles: { select: { rol: true } },
        },
      }),
      // CT
      prisma.cuerpoTecnico.findMany({
        where: { activo: true, estadoHabilitacion: { in: ["HABILITADO", "PENDIENTE"] } },
        select: {
          rol: true, genero: true, ciudad: true,
          nacionalidad: true, estadoHabilitacion: true,
          pagoVerificado: true, montoHabilitacion: true,
          tieneTitulo: true,
        },
      }),
      // Cursos
      prisma.curso.count({ where: { estado: "ACTIVO" } }),
      prisma.curso.count({ where: { estado: "BORRADOR" } }),
      prisma.inscripcion.count(),
      prisma.inscripcion.count({ where: { estado: "ACTIVO" } }),
      prisma.inscripcion.count({ where: { estado: "COMPLETADO" } }),
      prisma.certificado.count(),
      // Finanzas cursos
      prisma.pago.aggregate({ where: { estado: "CONFIRMADO" }, _sum: { monto: true } }),
      prisma.pago.count({ where: { estado: "PENDIENTE_REVISION" } }),
      prisma.pago.count({ where: { estado: "CONFIRMADO" } }),
      prisma.pago.findMany({
        where: { estado: "CONFIRMADO", createdAt: { gte: sixMonthsAgo } },
        select: { monto: true, createdAt: true },
      }),
      // Partidos
      prisma.partido.count(),
      prisma.partido.count({ where: { estado: "PROGRAMADO" } }),
      prisma.partido.count({ where: { estado: "FINALIZADO" } }),
      prisma.designacion.count(),
      // Honorarios
      prisma.honorario.aggregate({ where: { estado: "PENDIENTE" }, _sum: { monto: true } }),
      prisma.honorario.aggregate({ where: { estado: "PAGADO" }, _sum: { monto: true } }),
      // Website
      prisma.noticia.count({ where: { publicada: true } }),
      prisma.club.count({ where: { activo: true } }),
      prisma.seleccion.count({ where: { activo: true } }),
      prisma.mensajeContacto.count({ where: { leido: false } }),
      // Registros por mes (últimos 6 meses)
      prisma.usuario.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
    ])

    // ─── Oficiales: distribución por rol ───
    const roleCount: Record<string, number> = {}
    allUsuarios.forEach(u => {
      u.roles.forEach(r => {
        roleCount[r.rol] = (roleCount[r.rol] || 0) + 1
      })
    })

    // ─── Oficiales: top ciudades ───
    const cityCount: Record<string, number> = {}
    allUsuarios.forEach(u => {
      if (!u.ciudad) return
      cityCount[u.ciudad] = (cityCount[u.ciudad] || 0) + 1
    })
    const topCiudadesOficiales = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // ─── Oficiales: edades ───
    const now = new Date()
    const ageRanges: Record<string, number> = {
      "16-20": 0, "21-25": 0, "26-30": 0, "31-35": 0,
      "36-40": 0, "41-50": 0, "51+": 0,
    }
    allUsuarios.forEach(u => {
      if (!u.fechaNacimiento) return
      const age = Math.floor((now.getTime() - new Date(u.fechaNacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 10 || age > 80) return
      if (age <= 20) ageRanges["16-20"]++
      else if (age <= 25) ageRanges["21-25"]++
      else if (age <= 30) ageRanges["26-30"]++
      else if (age <= 35) ageRanges["31-35"]++
      else if (age <= 40) ageRanges["36-40"]++
      else if (age <= 50) ageRanges["41-50"]++
      else ageRanges["51+"]++
    })

    // ─── CT: stats ───
    const ctTotal = allCT.length
    const ctHabilitados = allCT.filter(m => m.estadoHabilitacion === "HABILITADO").length
    const ctPendientes = allCT.filter(m => m.estadoHabilitacion === "PENDIENTE").length
    const ctIngresoTotal = allCT.filter(m => m.pagoVerificado).reduce((s, m) => s + Number(m.montoHabilitacion), 0)
    const ctIngresoPotencial = allCT.reduce((s, m) => s + Number(m.montoHabilitacion), 0)
    const ctConTitulo = allCT.filter(m => m.tieneTitulo).length

    const ctRoleCount: Record<string, number> = {}
    allCT.forEach(m => { ctRoleCount[m.rol] = (ctRoleCount[m.rol] || 0) + 1 })

    const ctNacionalidad: Record<string, number> = {}
    allCT.forEach(m => {
      const nat = m.nacionalidad.toLowerCase().includes("paragua") ? "Paraguaya" : "Extranjera"
      ctNacionalidad[nat] = (ctNacionalidad[nat] || 0) + 1
    })

    const ctTopCiudades = (() => {
      const c: Record<string, number> = {}
      allCT.forEach(m => { c[m.ciudad] = (c[m.ciudad] || 0) + 1 })
      return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8)
    })()

    // ─── Ingresos por mes ───
    const ingresosPorMes: Record<string, number> = {}
    pagosRecientes.forEach(p => {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`
      ingresosPorMes[key] = (ingresosPorMes[key] || 0) + Number(p.monto)
    })

    // ─── Registros por mes ───
    const registrosPorMes: Record<string, number> = {}
    usuariosPorMes.forEach(u => {
      const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, "0")}`
      registrosPorMes[key] = (registrosPorMes[key] || 0) + 1
    })

    return NextResponse.json({
      // Oficiales
      oficiales: {
        total: totalUsuarios,
        verificados,
        pendientes,
        rechazados,
        hombres: hombresOficiales,
        mujeres: mujeresOficiales,
        roleCount,
        topCiudades: topCiudadesOficiales,
        ageRanges,
      },
      // Cuerpo Técnico
      cuerpoTecnico: {
        total: ctTotal,
        habilitados: ctHabilitados,
        pendientes: ctPendientes,
        ingresoTotal: ctIngresoTotal,
        ingresoPotencial: ctIngresoPotencial,
        conTitulo: ctConTitulo,
        sinTitulo: ctTotal - ctConTitulo,
        roleCount: ctRoleCount,
        nacionalidad: ctNacionalidad,
        topCiudades: ctTopCiudades,
      },
      // Cursos
      cursos: {
        activos: cursosActivos,
        borrador: cursosBorrador,
        totalInscripciones,
        inscripcionesActivas,
        inscripcionesCompletadas,
        certificadosEmitidos,
      },
      // Finanzas
      finanzas: {
        ingresosCursos: Number(ingresosCursos._sum.monto || 0),
        pagosPendientes,
        pagosConfirmados,
        honorariosPendientes: Number(honorariosPendientesSum._sum.monto || 0),
        honorariosPagados: Number(honorariosPagadosSum._sum.monto || 0),
        ingresosPorMes,
      },
      // Partidos
      partidos: {
        total: totalPartidos,
        programados: partidosProgramados,
        finalizados: partidosFinalizados,
        totalDesignaciones,
      },
      // Website
      website: {
        noticiasPublicadas,
        clubesActivos,
        seleccionesActivas,
        mensajesSinLeer,
      },
      // Tendencias
      registrosPorMes,
      generadoEn: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error, { context: "admin/estadisticas" })
  }
}
