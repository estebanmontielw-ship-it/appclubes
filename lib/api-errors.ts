import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import * as Sentry from "@sentry/nextjs"

/**
 * Manejo centralizado de errores para API routes.
 * Detecta errores de Prisma y los mapea a códigos HTTP apropiados.
 */

interface ErrorResponseOptions {
  /** Contexto adicional para el log (ej: "POST /api/cursos/inscribir") */
  context?: string
}

/**
 * Procesa un error y devuelve un NextResponse con el código HTTP apropiado.
 * - P2002 (unique constraint) → 409 Conflict
 * - P2025 (record not found) → 404 Not Found
 * - P2003 (foreign key constraint) → 400 Bad Request
 * - P2014 (relation violation) → 400 Bad Request
 * - Otros errores Prisma → 500 con mensaje descriptivo
 * - Errores genéricos → 500
 */
export function handleApiError(
  error: unknown,
  options?: ErrorResponseOptions
): NextResponse {
  const ctx = options?.context ? `[${options.context}]` : "[API]"

  // Errores de Prisma conocidos
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`${ctx} Prisma error ${error.code}:`, error.message)

    switch (error.code) {
      case "P2002": {
        // Unique constraint violation
        const fields = (error.meta?.target as string[])?.join(", ") || "campo"
        return NextResponse.json(
          { error: `Ya existe un registro con ese ${fields}` },
          { status: 409 }
        )
      }
      case "P2025":
        // Record not found
        return NextResponse.json(
          { error: "Registro no encontrado" },
          { status: 404 }
        )
      case "P2003":
        // Foreign key constraint
        return NextResponse.json(
          { error: "Referencia inválida: el registro relacionado no existe" },
          { status: 400 }
        )
      case "P2014":
        // Required relation violation
        return NextResponse.json(
          { error: "No se puede eliminar porque tiene datos relacionados" },
          { status: 400 }
        )
      case "P2021": {
        // Table does not exist — missing migration in this environment
        const table = (error.meta?.table as string) || "una tabla"
        return NextResponse.json(
          { error: `La tabla "${table}" no existe en la base de datos. Falta correr la migración correspondiente.` },
          { status: 500 }
        )
      }
      case "P2022": {
        // Column does not exist — schema drifted from migration
        const column = (error.meta?.column as string) || "una columna"
        return NextResponse.json(
          { error: `La columna "${column}" no existe en la base de datos. Falta correr la migración correspondiente.` },
          { status: 500 }
        )
      }
      default:
        Sentry.captureException(error, { tags: { context: ctx, prismaCode: error.code } })
        return NextResponse.json(
          { error: "Error de base de datos" },
          { status: 500 }
        )
    }
  }

  // Errores de validación de Prisma (campos inválidos, tipos incorrectos)
  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error(`${ctx} Prisma validation error:`, error.message)
    return NextResponse.json(
      { error: "Datos inválidos enviados al servidor" },
      { status: 400 }
    )
  }

  // Errores genéricos de JavaScript
  if (error instanceof Error) {
    console.error(`${ctx} Error:`, error.message)
    Sentry.captureException(error, { tags: { context: ctx } })
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }

  // Error desconocido
  console.error(`${ctx} Unknown error:`, error)
  Sentry.captureException(error, { tags: { context: ctx } })
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  )
}
