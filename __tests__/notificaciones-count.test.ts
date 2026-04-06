import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Supabase
vi.mock("@/utils/supabase/server", () => {
  const mockGetUser = vi.fn()
  return {
    createClient: () => ({
      auth: { getUser: mockGetUser },
    }),
    __mockGetUser: mockGetUser,
  }
})

vi.mock("next/headers", () => ({
  cookies: () => ({}),
}))

// Mock Prisma
vi.mock("@/lib/prisma", () => {
  const mockNotifCount = vi.fn()
  const mockRoleFindMany = vi.fn()
  const mockUsuarioCount = vi.fn()
  const mockPagoCount = vi.fn()
  const mockCTCount = vi.fn()
  return {
    default: {
      notificacion: { count: mockNotifCount },
      usuarioRol: { findMany: mockRoleFindMany },
      usuario: { count: mockUsuarioCount },
      pago: { count: mockPagoCount },
      cuerpoTecnico: { count: mockCTCount },
    },
    __mockNotifCount: mockNotifCount,
    __mockRoleFindMany: mockRoleFindMany,
    __mockUsuarioCount: mockUsuarioCount,
    __mockPagoCount: mockPagoCount,
    __mockCTCount: mockCTCount,
  }
})

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status || 200,
    }),
  },
}))

import { GET } from "@/app/api/notificaciones/count/route"

let mockGetUser: ReturnType<typeof vi.fn>
let mockNotifCount: ReturnType<typeof vi.fn>
let mockRoleFindMany: ReturnType<typeof vi.fn>
let mockUsuarioCount: ReturnType<typeof vi.fn>
let mockPagoCount: ReturnType<typeof vi.fn>
let mockCTCount: ReturnType<typeof vi.fn>

beforeEach(async () => {
  const supabaseMod = (await import("@/utils/supabase/server")) as any
  const prismaMod = (await import("@/lib/prisma")) as any
  mockGetUser = supabaseMod.__mockGetUser
  mockNotifCount = prismaMod.__mockNotifCount
  mockRoleFindMany = prismaMod.__mockRoleFindMany
  mockUsuarioCount = prismaMod.__mockUsuarioCount
  mockPagoCount = prismaMod.__mockPagoCount
  mockCTCount = prismaMod.__mockCTCount
  vi.clearAllMocks()
  // Defaults
  mockRoleFindMany.mockResolvedValue([])
})

describe("GET /api/notificaciones/count", () => {
  it("should return unread count for authenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    })
    mockNotifCount.mockResolvedValue(5)
    mockRoleFindMany.mockResolvedValue([{ rol: "ARBITRO" }])

    const result = (await GET()) as any
    expect(result.body.unreadCount).toBe(5)
  })

  it("should return 0 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    })

    const result = (await GET()) as any
    expect(result.body.unreadCount).toBe(0)
    expect(mockNotifCount).not.toHaveBeenCalled()
  })

  it("should return 0 on error", async () => {
    mockGetUser.mockRejectedValue(new Error("DB error"))

    const result = (await GET()) as any
    expect(result.body.unreadCount).toBe(0)
  })

  it("should return pending counters for admin users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    })
    mockNotifCount.mockResolvedValue(3)
    mockRoleFindMany.mockResolvedValue([{ rol: "SUPER_ADMIN" }])
    mockUsuarioCount.mockResolvedValue(7)
    mockPagoCount.mockResolvedValue(2)
    mockCTCount.mockResolvedValue(4)

    const result = (await GET()) as any
    expect(result.body.unreadCount).toBe(3)
    expect(result.body.pendingUsers).toBe(7)
    expect(result.body.pendingPayments).toBe(2)
    expect(result.body.pendingCT).toBe(4)
  })

  it("should NOT return pending counters for non-admin users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-456" } },
    })
    mockNotifCount.mockResolvedValue(0)
    mockRoleFindMany.mockResolvedValue([{ rol: "ARBITRO" }])

    const result = (await GET()) as any
    expect(result.body.unreadCount).toBe(0)
    expect(result.body.pendingUsers).toBeUndefined()
    expect(result.body.pendingPayments).toBeUndefined()
    expect(result.body.pendingCT).toBeUndefined()
  })
})
