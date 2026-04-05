import { createServiceClient } from "@/lib/supabase"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { emailBienvenidaCT, emailCTAutoHabilitado } from "@/lib/email"
import { sendAdminPush } from "@/lib/admin-push"
import { handleApiError } from "@/lib/api-errors"

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

    if (!nombre || !apellido || !cedula || !email || !password) {
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
    const nombreNorm = normalizeName(nombre)
    const apellidoNorm = normalizeName(apellido)
    const fullNameNorm = normalizeName(`${nombre} ${apellido}`)
    const nameParts = fullNameNorm.split(" ").filter(p => p.length > 1)

    // Get all unused pre-verified entries
    const allPreVerificados = await prisma.ctPreverificado.findMany({
      where: { usado: false },
    })

    // Smart matching: find best match
    let autoVerificado = false
    let matchedPre: typeof allPreVerificados[0] | null = null
    let bestScore = 0

    for (const pre of allPreVerificados) {
      const preNorm = pre.nombreNormalizado
      const preParts = preNorm.split(" ").filter(p => p.length > 1)

      // Method 1: count matching parts
      const score1 = nameParts.filter(p => preParts.some(pp => pp === p || pp.startsWith(p) || p.startsWith(pp))).length
      const score2 = preParts.filter(pp => nameParts.some(p => p === pp || p.startsWith(pp) || pp.startsWith(p))).length

      // Method 2: check apellido and nombre in pre name
      const apellidoParts = apellidoNorm.split(" ").filter(p => p.length > 2)
      const apellidoMatch = apellidoParts.some(ap => preNorm.includes(ap))
      const nombreParts = nombreNorm.split(" ").filter(p => p.length > 2)
      const nombreMatch = nombreParts.some(np => preNorm.includes(np))

      let finalScore = Math.max(score1, score2)
      if (apellidoMatch && nombreMatch) finalScore = Math.max(finalScore, 3)
      if (apellidoMatch && finalScore >= 1) finalScore = Math.max(finalScore, 2)

      if (finalScore >= 2 && finalScore > bestScore) {
        bestScore = finalScore
        matchedPre = pre
        autoVerificado = true
      }
    }

    // Determine final rol
    const rolMap: Record<string, string> = {
      "entrenador nacional": "ENTRENADOR_NACIONAL",
      "entrenador extranjero": "ENTRENADOR_EXTRANJERO",
      "asistente": "ASISTENTE",
      "preparador fisico": "PREPARADOR_FISICO",
      "preparador físico": "PREPARADOR_FISICO",
      "fisioterapeuta": "FISIO",
      "fisio": "FISIO",
      "utilero": "UTILERO",
    }

    let finalRol = rol
    if (!finalRol && autoVerificado && matchedPre?.rol) {
      finalRol = rolMap[matchedPre.rol.toLowerCase()] || matchedPre.rol
    }
    if (!finalRol) {
      return NextResponse.json({ error: "Seleccioná tu rol" }, { status: 400 })
    }

    const qrToken = uuidv4()
    const precio = getPrecio(finalRol)

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
        rol: finalRol,
        fotoCarnetUrl: fotoCarnetUrl || null,
        fotoCedulaUrl: fotoCedulaUrl || null,
        tituloEntrenadorUrl: tituloEntrenadorUrl || null,
        tieneTitulo: tieneTitulo || false,
        razonSocial: razonSocial || null,
        ruc: ruc || null,
        montoHabilitacion: precio,
        pagoVerificado: autoVerificado,
        pagoAutoVerificado: autoVerificado,
        estadoHabilitacion: autoVerificado ? "HABILITADO" : "PENDIENTE",
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

    // Send email
    if (autoVerificado) {
      emailCTAutoHabilitado(email, nombre).catch(() => {})
    } else {
      emailBienvenidaCT(email, nombre).catch(() => {})
    }

    // Notify admin
    sendAdminPush(
      "Nuevo cuerpo técnico",
      `${nombre} ${apellido} se registró como ${finalRol}${autoVerificado ? " (auto-habilitado)" : ""}`
    ).catch(() => {})

    return NextResponse.json({
      ct,
      autoVerificado,
      precio,
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/ct/auth/registro" })
  }
}
