import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock auth
vi.mock("@/lib/api-auth", () => {
  const fn = vi.fn()
  return {
    requireRole: fn,
    isAuthError: (result: any) => !("user" in result),
    __mockRequireRole: fn,
  }
})

// Mock Prisma
vi.mock("@/lib/prisma", () => {
  const p = {
    usuario: { count: vi.fn(), findMany: vi.fn() },
    cuerpoTecnico: { findMany: vi.fn() },
    curso: { count: vi.fn() },
    inscripcion: { count: vi.fn() },
    certificado: { count: vi.fn() },
    pago: { aggregate: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    honorario: { aggregate: vi.fn() },
    partido: { count: vi.fn() },
    designacion: { count: vi.fn() },
    noticia: { count: vi.fn() },
    club: { count: vi.fn() },
    seleccion: { count: vi.fn() },
    mensajeContacto: { count: vi.fn() },
  }
  return { default: p, __mockPrisma: p }
})

vi.mock("@/lib/api-errors", () => ({
  handleApiError: (error: unknown) => ({
    body: { error: "Error" },
    status: 500,
  }),
}))

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status || 200,
    }),
  },
}))

import { GET } from "@/app/api/admin/estadisticas/route"

let mockRequireRole: ReturnType<typeof vi.fn>
let mockPrisma: any

beforeEach(async () => {
  const authMod = (await import("@/lib/api-auth")) as any
  const prismaMod = (await import("@/lib/prisma")) as any
  mockRequireRole = authMod.__mockRequireRole
  mockPrisma = prismaMod.__mockPrisma
  vi.clearAllMocks()

  // Defaults
  mockPrisma.usuario.count.mockResolvedValue(0)
  mockPrisma.usuario.findMany.mockResolvedValue([])
  mockPrisma.cuerpoTecnico.findMany.mockResolvedValue([])
  mockPrisma.curso.count.mockResolvedValue(0)
  mockPrisma.inscripcion.count.mockResolvedValue(0)
  mockPrisma.certificado.count.mockResolvedValue(0)
  mockPrisma.pago.aggregate.mockResolvedValue({ _sum: { monto: null } })
  mockPrisma.pago.count.mockResolvedValue(0)
  mockPrisma.pago.findMany.mockResolvedValue([])
  mockPrisma.honorario.aggregate.mockResolvedValue({ _sum: { monto: null } })
  mockPrisma.partido.count.mockResolvedValue(0)
  mockPrisma.designacion.count.mockResolvedValue(0)
  mockPrisma.noticia.count.mockResolvedValue(0)
  mockPrisma.club.count.mockResolvedValue(0)
  mockPrisma.seleccion.count.mockResolvedValue(0)
  mockPrisma.mensajeContacto.count.mockResolvedValue(0)
})

describe("GET /api/admin/estadisticas", () => {
  it("should return 403 for non-admin users", async () => {
    mockRequireRole.mockResolvedValue({
      body: { error: "No autorizado" },
      status: 403,
    })

    const result = (await GET()) as any
    expect(result.status).toBe(403)
  })

  it("should return comprehensive stats for admin", async () => {
    mockRequireRole.mockResolvedValue({ user: { id: "admin-1" } })

    mockPrisma.usuario.count
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(80)  // verificados
      .mockResolvedValueOnce(15)  // pendientes
      .mockResolvedValueOnce(5)   // rechazados
      .mockResolvedValueOnce(60)  // hombres
      .mockResolvedValueOnce(40)  // mujeres

    mockPrisma.usuario.findMany
      .mockResolvedValueOnce([
        { ciudad: "Asunción", fechaNacimiento: new Date("1990-01-01"), roles: [{ rol: "ARBITRO" }] },
        { ciudad: "Luque", fechaNacimiento: new Date("1985-05-15"), roles: [{ rol: "MESA" }] },
      ])
      .mockResolvedValueOnce([{ createdAt: new Date() }])

    mockPrisma.cuerpoTecnico.findMany.mockResolvedValue([
      {
        rol: "ENTRENADOR_NACIONAL", genero: "Masculino", ciudad: "Asunción",
        nacionalidad: "Paraguaya", estadoHabilitacion: "HABILITADO",
        pagoVerificado: true, montoHabilitacion: 500000, tieneTitulo: true,
      },
    ])

    mockPrisma.curso.count.mockResolvedValue(3)
    mockPrisma.inscripcion.count
      .mockResolvedValueOnce(50).mockResolvedValueOnce(30).mockResolvedValueOnce(15)
    mockPrisma.certificado.count.mockResolvedValue(10)
    mockPrisma.partido.count
      .mockResolvedValueOnce(20).mockResolvedValueOnce(5).mockResolvedValueOnce(15)
    mockPrisma.designacion.count.mockResolvedValue(80)
    mockPrisma.noticia.count.mockResolvedValue(12)
    mockPrisma.club.count.mockResolvedValue(8)
    mockPrisma.seleccion.count.mockResolvedValue(4)
    mockPrisma.mensajeContacto.count.mockResolvedValue(2)

    const result = (await GET()) as any
    expect(result.status).toBe(200)

    const body = result.body
    // Oficiales
    expect(body.oficiales.total).toBe(100)
    expect(body.oficiales.verificados).toBe(80)
    expect(body.oficiales.hombres).toBe(60)
    expect(body.oficiales.roleCount).toEqual({ ARBITRO: 1, MESA: 1 })
    expect(body.oficiales.topCiudades).toHaveLength(2)

    // CT
    expect(body.cuerpoTecnico.total).toBe(1)
    expect(body.cuerpoTecnico.habilitados).toBe(1)
    expect(body.cuerpoTecnico.ingresoTotal).toBe(500000)
    expect(body.cuerpoTecnico.conTitulo).toBe(1)

    // Cursos
    expect(body.cursos.activos).toBe(3)
    expect(body.cursos.certificadosEmitidos).toBe(10)

    // Partidos
    expect(body.partidos.total).toBe(20)
    expect(body.partidos.totalDesignaciones).toBe(80)

    // Website
    expect(body.website.noticiasPublicadas).toBe(12)
    expect(body.website.clubesActivos).toBe(8)

    // Meta
    expect(body.generadoEn).toBeDefined()
  })

  it("should handle empty data gracefully", async () => {
    mockRequireRole.mockResolvedValue({ user: { id: "admin-1" } })

    const result = (await GET()) as any
    expect(result.status).toBe(200)
    expect(result.body.oficiales.total).toBe(0)
    expect(result.body.cuerpoTecnico.total).toBe(0)
    expect(result.body.finanzas.ingresosCursos).toBe(0)
    expect(result.body.finanzas.honorariosPendientes).toBe(0)
    expect(result.body.finanzas.honorariosPagados).toBe(0)
  })

  it("should correctly calculate CT nationality distribution", async () => {
    mockRequireRole.mockResolvedValue({ user: { id: "admin-1" } })

    mockPrisma.cuerpoTecnico.findMany.mockResolvedValue([
      { rol: "ENTRENADOR_NACIONAL", genero: "M", ciudad: "Asu", nacionalidad: "Paraguaya", estadoHabilitacion: "HABILITADO", pagoVerificado: false, montoHabilitacion: 0, tieneTitulo: false },
      { rol: "ENTRENADOR_EXTRANJERO", genero: "M", ciudad: "CDE", nacionalidad: "Argentina", estadoHabilitacion: "PENDIENTE", pagoVerificado: false, montoHabilitacion: 0, tieneTitulo: true },
      { rol: "ASISTENTE", genero: "F", ciudad: "Asu", nacionalidad: "Paraguaya", estadoHabilitacion: "HABILITADO", pagoVerificado: true, montoHabilitacion: 300000, tieneTitulo: false },
    ])

    const result = (await GET()) as any
    expect(result.body.cuerpoTecnico.nacionalidad).toEqual({ Paraguaya: 2, Extranjera: 1 })
    expect(result.body.cuerpoTecnico.conTitulo).toBe(1)
    expect(result.body.cuerpoTecnico.sinTitulo).toBe(2)
  })
})
