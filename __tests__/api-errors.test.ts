import { describe, it, expect, vi, beforeEach } from "vitest"
import { handleApiError } from "@/lib/api-errors"
import { Prisma } from "@prisma/client"

// Mock NextResponse
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status || 200,
    }),
  },
}))

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}))

// Suppress console.error in tests
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

function createPrismaError(code: string, meta?: Record<string, unknown>) {
  const error = new Prisma.PrismaClientKnownRequestError("Test error", {
    code,
    clientVersion: "5.0.0",
    meta,
  })
  return error
}

describe("handleApiError", () => {
  describe("Prisma known errors", () => {
    it("should return 409 for unique constraint violation (P2002)", () => {
      const error = createPrismaError("P2002", { target: ["email"] })
      const result = handleApiError(error) as any

      expect(result.status).toBe(409)
      expect(result.body.error).toContain("email")
    })

    it("should return 409 with 'campo' when P2002 has no target", () => {
      const error = createPrismaError("P2002")
      const result = handleApiError(error) as any

      expect(result.status).toBe(409)
      expect(result.body.error).toContain("campo")
    })

    it("should return 404 for record not found (P2025)", () => {
      const error = createPrismaError("P2025")
      const result = handleApiError(error) as any

      expect(result.status).toBe(404)
      expect(result.body.error).toContain("no encontrado")
    })

    it("should return 400 for foreign key constraint (P2003)", () => {
      const error = createPrismaError("P2003")
      const result = handleApiError(error) as any

      expect(result.status).toBe(400)
      expect(result.body.error).toContain("Referencia inválida")
    })

    it("should return 400 for relation violation (P2014)", () => {
      const error = createPrismaError("P2014")
      const result = handleApiError(error) as any

      expect(result.status).toBe(400)
      expect(result.body.error).toContain("datos relacionados")
    })

    it("should return 500 for unknown Prisma error codes and report to Sentry", async () => {
      const Sentry = await import("@sentry/nextjs")
      const error = createPrismaError("P9999")
      const result = handleApiError(error) as any

      expect(result.status).toBe(500)
      expect(result.body.error).toBe("Error de base de datos")
      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ tags: expect.objectContaining({ prismaCode: "P9999" }) })
      )
    })
  })

  describe("Prisma validation errors", () => {
    it("should return 400 for validation errors", () => {
      const error = new Prisma.PrismaClientValidationError("Invalid field", {
        clientVersion: "5.0.0",
      })
      const result = handleApiError(error) as any

      expect(result.status).toBe(400)
      expect(result.body.error).toContain("Datos inválidos")
    })
  })

  describe("Generic JavaScript errors", () => {
    it("should return 500 for generic Error and report to Sentry", async () => {
      const Sentry = await import("@sentry/nextjs")
      const error = new Error("Something went wrong")
      const result = handleApiError(error) as any

      expect(result.status).toBe(500)
      expect(result.body.error).toBe("Error interno del servidor")
      expect(Sentry.captureException).toHaveBeenCalled()
    })

    it("should return 500 for TypeError", () => {
      const error = new TypeError("Cannot read property")
      const result = handleApiError(error) as any

      expect(result.status).toBe(500)
      expect(result.body.error).toBe("Error interno del servidor")
    })
  })

  describe("Unknown errors", () => {
    it("should return 500 for string errors", () => {
      const result = handleApiError("some string error") as any

      expect(result.status).toBe(500)
      expect(result.body.error).toBe("Error interno del servidor")
    })

    it("should return 500 for null errors", () => {
      const result = handleApiError(null) as any

      expect(result.status).toBe(500)
    })

    it("should return 500 for undefined errors", () => {
      const result = handleApiError(undefined) as any

      expect(result.status).toBe(500)
    })
  })

  describe("Context option", () => {
    it("should include context in console.error", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const error = new Error("test")
      handleApiError(error, { context: "POST /api/test" })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[POST /api/test]"),
        expect.anything()
      )
    })

    it("should use [API] as default context", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const error = new Error("test")
      handleApiError(error)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[API]"),
        expect.anything()
      )
    })
  })
})
