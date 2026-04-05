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
  const mockCount = vi.fn()
  return {
    default: {
      notificacion: { count: mockCount },
    },
    __mockCount: mockCount,
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
let mockCount: ReturnType<typeof vi.fn>

beforeEach(async () => {
  const supabaseMod = (await import("@/utils/supabase/server")) as any
  const prismaMod = (await import("@/lib/prisma")) as any
  mockGetUser = supabaseMod.__mockGetUser
  mockCount = prismaMod.__mockCount
  vi.clearAllMocks()
})

describe("GET /api/notificaciones/count", () => {
  it("should return unread count for authenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    })
    mockCount.mockResolvedValue(5)

    const result = (await GET()) as any
    expect(result.body.unreadCount).toBe(5)
    expect(mockCount).toHaveBeenCalledWith({
      where: { usuarioId: "user-123", leido: false },
    })
  })

  it("should return 0 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    })

    const result = (await GET()) as any
    expect(result.body.unreadCount).toBe(0)
    expect(mockCount).not.toHaveBeenCalled()
  })

  it("should return 0 on error", async () => {
    mockGetUser.mockRejectedValue(new Error("DB error"))

    const result = (await GET()) as any
    expect(result.body.unreadCount).toBe(0)
  })

  it("should return 0 when user has no unread notifications", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-456" } },
    })
    mockCount.mockResolvedValue(0)

    const result = (await GET()) as any
    expect(result.body.unreadCount).toBe(0)
  })
})
