import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [
      total,
      verificados,
      pendientes,
      rechazados,
      allUsers,
      hombres,
      mujeres,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { estadoVerificacion: "VERIFICADO" } }),
      prisma.usuario.count({ where: { estadoVerificacion: "PENDIENTE" } }),
      prisma.usuario.count({ where: { estadoVerificacion: "RECHAZADO" } }),
      prisma.usuario.findMany({
        select: {
          id: true, ciudad: true, barrio: true, fechaNacimiento: true,
          estadoVerificacion: true, createdAt: true,
          roles: { select: { rol: true } },
        },
      }),
      prisma.usuario.count({ where: { genero: "Masculino" } }),
      prisma.usuario.count({ where: { genero: "Femenino" } }),
    ])

    // Distribution by role
    const roleCount: Record<string, number> = {}
    allUsers.forEach(u => {
      u.roles.forEach(r => {
        roleCount[r.rol] = (roleCount[r.rol] || 0) + 1
      })
    })

    // Distribution by city
    const cityCount: Record<string, number> = {}
    allUsers.forEach(u => {
      cityCount[u.ciudad] = (cityCount[u.ciudad] || 0) + 1
    })
    const topCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Age distribution
    const now = new Date()
    const ages = allUsers.map(u => {
      const birth = new Date(u.fechaNacimiento)
      return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    }).filter(a => a > 10 && a < 80)

    const ageRanges: Record<string, number> = {
      "16-20": 0, "21-25": 0, "26-30": 0, "31-35": 0,
      "36-40": 0, "41-50": 0, "51+": 0,
    }
    ages.forEach(age => {
      if (age <= 20) ageRanges["16-20"]++
      else if (age <= 25) ageRanges["21-25"]++
      else if (age <= 30) ageRanges["26-30"]++
      else if (age <= 35) ageRanges["31-35"]++
      else if (age <= 40) ageRanges["36-40"]++
      else if (age <= 50) ageRanges["41-50"]++
      else ageRanges["51+"]++
    })

    // Registrations by month (last 6)
    const monthCount: Record<string, number> = {}
    allUsers.forEach(u => {
      const d = new Date(u.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthCount[key] = (monthCount[key] || 0) + 1
    })

    return NextResponse.json({
      total, verificados, pendientes, rechazados,
      hombres, mujeres,
      roleCount, topCities, ageRanges, monthCount,
    })
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
