import { createServiceClient } from "@/lib/supabase"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { emailBienvenida } from "@/lib/email"

// Normalize name for matching
function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

// Get price by role
function getPrecio(rol: string): number {
  switch (rol) {
    case "ENTRENADOR_EXTRANJERO": return 700000
    case "ENTRENADOR_NACIONAL": return 300000
    case "ASISTENTE":
    case "PREPARADOR_FISICO":
    case "FISIO": return 200000
    case "UTILERO": return 100000
    default: return 300000
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nombre, apellido, cedula, fechaNacimiento, telefono, ciudad,
      genero, nacionalidad, email, password, rol,
      fotoCarnetUrl, fotoCedulaUrl, tituloEntrenadorUrl, tieneTitulo,
      razonSocial, ruc,
    } = body

    if (!nombre || !apellido || !cedula || !email || !password || !rol) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Check if cedula already exists
    const existingCedula = await prisma.cuerpoTecnico.findUnique({ where: { cedula } })
    if (existingCedula) {
      return NextResponse.json({ error: "Ya existe un registro con esa cédula" }, { status: 400 })
    }

    // Create user in Supabase Auth
    const supabase = createServiceClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Error al crear el usuario" }, { status: 500 })
    }

    // Check auto-verification: smart name matching against pre-verified list
    const fullNameNorm = normalizeName(`${nombre} ${apellido}`)
    const nameParts = fullNameNorm.split(" ").filter(p => p.length > 2) // ignore short particles

    // Get all unused pre-verified entries
    const allPreVerificados = await prisma.ctPreverificado.findMany({
      where: { usado: false },
    })

    // Smart matching: find best match
    let autoVerificado = false
    let matchedPre: typeof allPreVerificados[0] | null = null
    let bestScore = 0

    for (const pre of allPreVerificados) {
      const preParts = pre.nombreNormalizado.split(" ").filter(p => p.length > 2)

      // Count how many name parts match
      const matchingParts = nameParts.filter(p => preParts.some(pp => pp === p || pp.startsWith(p) || p.startsWith(pp)))
      const score = matchingParts.length

      // Also check reverse: parts from pre that match in registration
      const reverseMatching = preParts.filter(pp => nameParts.some(p => p === pp || p.startsWith(pp) || pp.startsWith(p)))
      const reverseScore = reverseMatching.length

      // Use the higher score
      const finalScore = Math.max(score, reverseScore)

      // Need at least 2 matching parts (first name + last name minimum)
      if (finalScore >= 2 && finalScore > bestScore) {
        bestScore = finalScore
        matchedPre = pre
        autoVerificado = true
      }
    }

    const qrToken = uuidv4()
    const precio = getPrecio(rol)

    const ct = await prisma.cuerpoTecnico.create({
      data: {
        id: authData.user.id,
        email,
        nombre,
        apellido,
        cedula,
        fechaNacimiento: new Date(fechaNacimiento),
        telefono,
        ciudad,
        genero: genero || "Masculino",
        nacionalidad: nacionalidad || "Paraguaya",
        rol,
        fotoCarnetUrl: fotoCarnetUrl || null,
        fotoCedulaUrl: fotoCedulaUrl || null,
        tituloEntrenadorUrl: tituloEntrenadorUrl || null,
        tieneTitulo: tieneTitulo || false,
        razonSocial: razonSocial || null,
        ruc: ruc || null,
        montoHabilitacion: precio,
        periodoHabilitacion: new Date().getFullYear(),
        pagoVerificado: autoVerificado,
        pagoAutoVerificado: autoVerificado,
        estadoHabilitacion: "PENDIENTE",
        qrToken,
      },
    })

    // Mark pre-verificado as used
    if (autoVerificado && matchedPre) {
      await prisma.ctPreverificado.update({
        where: { id: matchedPre.id },
        data: { usado: true, usuarioCtId: ct.id },
      })
    }

    // Send welcome email
    emailBienvenida(email, nombre).catch(() => {})

    return NextResponse.json({
      ct,
      autoVerificado,
      precio,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error("Error en registro CT:", error)
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
