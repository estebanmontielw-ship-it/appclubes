import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const all = await prisma.cuerpoTecnico.findMany()

    const total = all.length
    const habilitados = all.filter(m => m.estadoHabilitacion === "HABILITADO").length
    const pendientes = all.filter(m => m.estadoHabilitacion === "PENDIENTE").length
    const pagoAuto = all.filter(m => m.pagoAutoVerificado).length
    const sinPago = all.filter(m => !m.pagoVerificado).length

    // Distribution by role
    const roleCount: Record<string, number> = {}
    all.forEach(m => {
      roleCount[m.rol] = (roleCount[m.rol] || 0) + 1
    })

    // Nationality
    const natCount: Record<string, number> = {}
    all.forEach(m => {
      const nat = m.nacionalidad.toLowerCase().includes("paragua") ? "Paraguaya" : "Extranjera"
      natCount[nat] = (natCount[nat] || 0) + 1
    })

    // With/without title
    const conTitulo = all.filter(m => m.tieneTitulo).length
    const sinTitulo = total - conTitulo

    // Income by role
    const ingresoPorRol: Record<string, number> = {}
    all.filter(m => m.pagoVerificado).forEach(m => {
      const label = m.rol.replace("_", " ")
      ingresoPorRol[label] = (ingresoPorRol[label] || 0) + Number(m.montoHabilitacion)
    })

    // Total income
    const ingresoTotal = all.filter(m => m.pagoVerificado).reduce((s, m) => s + Number(m.montoHabilitacion), 0)
    const ingresoPotencial = all.reduce((s, m) => s + Number(m.montoHabilitacion), 0)

    // Top cities
    const cityCount: Record<string, number> = {}
    all.forEach(m => {
      cityCount[m.ciudad] = (cityCount[m.ciudad] || 0) + 1
    })
    const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 8)

    // Gender
    const generoCount: Record<string, number> = {}
    all.forEach(m => {
      generoCount[m.genero] = (generoCount[m.genero] || 0) + 1
    })

    return NextResponse.json({
      total, habilitados, pendientes, pagoAuto, sinPago,
      roleCount, natCount, conTitulo, sinTitulo,
      ingresoPorRol, ingresoTotal, ingresoPotencial,
      topCities, generoCount,
    })
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
