import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: { in: ["SUPER_ADMIN", "INSTRUCTOR"] } },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const [
      usuariosTotales,
      verificados,
      pendientesVerificacion,
      rechazados,
      pendientesPagos,
      cursosActivos,
      inscripcionesActivas,
      ultimosUsuarios,
      ultimosPagos,
      // CT stats
      ctTotal,
      ctHabilitados,
      ctPendientes,
      ctSinPago,
      ultimosCT,
      // Website stats
      noticiasPublicadas,
      mensajesSinLeer,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { estadoVerificacion: "VERIFICADO" } }),
      prisma.usuario.count({ where: { estadoVerificacion: "PENDIENTE" } }),
      prisma.usuario.count({ where: { estadoVerificacion: "RECHAZADO" } }),
      prisma.pago.count({ where: { estado: "PENDIENTE_REVISION" } }),
      prisma.curso.count({ where: { estado: "ACTIVO" } }),
      prisma.inscripcion.count({ where: { estado: "ACTIVO" } }),
      prisma.usuario.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { roles: true },
      }),
      prisma.pago.findMany({
        take: 3,
        where: { estado: "PENDIENTE_REVISION" },
        orderBy: { createdAt: "desc" },
        include: {
          inscripcion: {
            include: {
              usuario: { select: { nombre: true, apellido: true } },
              curso: { select: { nombre: true } },
            },
          },
        },
      }),
      // CT
      prisma.cuerpoTecnico.count(),
      prisma.cuerpoTecnico.count({ where: { estadoHabilitacion: "HABILITADO" } }),
      prisma.cuerpoTecnico.count({ where: { estadoHabilitacion: "PENDIENTE" } }),
      prisma.cuerpoTecnico.count({ where: { pagoVerificado: false } }),
      prisma.cuerpoTecnico.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, nombre: true, apellido: true, rol: true, estadoHabilitacion: true, createdAt: true },
      }),
      // Website
      prisma.noticia.count({ where: { publicada: true } }),
      prisma.mensajeContacto.count({ where: { leido: false } }),
    ])

    return NextResponse.json({
      usuariosTotales,
      verificados,
      pendientesVerificacion,
      rechazados,
      pendientesPagos,
      cursosActivos,
      inscripcionesActivas,
      ultimosUsuarios,
      ultimosPagos,
      ctTotal,
      ctHabilitados,
      ctPendientes,
      ctSinPago,
      ultimosCT,
      noticiasPublicadas,
      mensajesSinLeer,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
