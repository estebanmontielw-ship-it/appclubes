import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, email, telefono, asunto, mensaje } = body

    if (!nombre || !email || !asunto || !mensaje) {
      return NextResponse.json(
        { error: "Nombre, email, asunto y mensaje son requeridos" },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    await prisma.mensajeContacto.create({
      data: {
        nombre,
        email,
        telefono: telefono || null,
        asunto,
        mensaje,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
