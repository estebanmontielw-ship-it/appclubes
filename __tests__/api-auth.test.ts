import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock dependencies before importing the module
vi.mock("@/utils/supabase/server", () => {
  const mockGetUser = vi.fn()
  return {
    createClient: () => ({
      auth: {
        getUser: mockGetUser,
      },
    }),
    __mockGetUser: mockGetUser,
  }
})

vi.mock("next/headers", () => ({
  cookies: () => ({}),
}))

vi.mock("@/lib/prisma", () => {
  const mockFindMany = vi.fn()
  return {
    default: {
      usuarioRol: {
        findMany: mockFindMany,
      },
    },
    __mockFindMany: mockFindMany,
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

import { requireAuth, requireRole, isAuthError } from "@/lib/api-auth"

// Get mock references after module resolution
let mockGetUser: ReturnType<typeof vi.fn>
let mockFindMany: ReturnType<typeof vi.fn>

beforeEach(async () => {
  const supabaseMod = (await import("@/utils/supabase/server")) as any
  const prismaMod = (await import("@/lib/prisma")) as any
  mockGetUser = supabaseMod.__mockGetUser
  mockFindMany = prismaMod.__mockFindMany
  vi.clearAllMocks()
})

describe("requireAuth", () => {
  it("should return user when authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@test.com" } },
    })

    const result = await requireAuth()
    expect(result).toEqual({
      user: { id: "user-123", email: "test@test.com" },
    })
  })

  it("should return 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    })

    const result = (await requireAuth()) as any
    expect(result.status).toBe(401)
    expect(result.body.error).toContain("No autenticado")
  })
})

describe("requireRole", () => {
  it("should return user when they have the required role", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@test.com" } },
    })
    mockFindMany.mockResolvedValue([{ rol: "SUPER_ADMIN" }])

    const result = await requireRole("SUPER_ADMIN")
    expect(result).toEqual({
      user: { id: "admin-1", email: "admin@test.com" },
    })
  })

  it("should return user when they have any of multiple required roles", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-2", email: "admin@test.com" } },
    })
    mockFindMany.mockResolvedValue([{ rol: "INSTRUCTOR" }])

    const result = await requireRole("SUPER_ADMIN", "INSTRUCTOR")
    expect(result).toEqual({
      user: { id: "admin-2", email: "admin@test.com" },
    })
  })

  it("should return 403 when user lacks required role", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-456", email: "user@test.com" } },
    })
    mockFindMany.mockResolvedValue([])

    const result = (await requireRole("SUPER_ADMIN")) as any
    expect(result.status).toBe(403)
    expect(result.body.error).toContain("No autorizado")
  })

  it("should return 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    })

    const result = (await requireRole("SUPER_ADMIN")) as any
    expect(result.status).toBe(401)
    expect(result.body.error).toContain("No autenticado")
  })

  it("should pass correct roles to prisma query", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-789" } },
    })
    mockFindMany.mockResolvedValue([])

    await requireRole("SUPER_ADMIN", "INSTRUCTOR", "DESIGNADOR")

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        usuarioId: "user-789",
        rol: { in: ["SUPER_ADMIN", "INSTRUCTOR", "DESIGNADOR"] },
      },
      select: { rol: true },
    })
  })
})

describe("isAuthError", () => {
  it("should return true for NextResponse (error result)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await requireAuth()
    expect(isAuthError(result)).toBe(true)
  })

  it("should return false for successful auth result", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-ok" } },
    })
    const result = await requireAuth()
    expect(isAuthError(result)).toBe(false)
  })
})
