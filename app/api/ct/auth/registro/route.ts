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

    // Check auto-verification: match name against pre-verified list
    const fullNameNorm = normalizeName(`${nombre} ${apellido}`)
    const preVerificado = await prisma.ctPreverificado.findFirst({
      where: {
        nombreNormalizado: { contains: fullNameNorm.split(" ")[0] },
        usado: false,
      },
    })

    // More precise match
    let autoVerificado = false
    let matchedPre: typeof preVerificado = null
    if (preVerificado) {
      // Check if at least first name and last name match
      const preNorm = preVerificado.nombreNormalizado
      const nameParts = fullNameNorm.split(" ")
      const preParts = preNorm.split(" ")
      const matchCount = nameParts.filter(p => preParts.includes(p)).length
      if (matchCount >= 2) {
        autoVerificado = true
        matchedPre = preVerificado
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
