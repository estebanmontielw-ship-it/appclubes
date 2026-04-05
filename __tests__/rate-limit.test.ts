import { describe, it, expect, beforeEach, vi } from "vitest"
import { rateLimit } from "@/lib/rate-limit"

// Mock NextResponse
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body,
      status: init?.status || 200,
      headers: init?.headers || {},
    }),
  },
}))

function createRequest(ip: string = "192.168.1.1"): Request {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  })
}

describe("rateLimit", () => {
  beforeEach(() => {
    // Reset the internal store between tests by advancing time
    vi.useFakeTimers()
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)
    vi.useRealTimers()
  })

  it("should allow requests within the limit", () => {
    const request = createRequest("10.0.0.1")
    const result = rateLimit(request, 5, 60_000, "test-allow")
    expect(result).toBeNull()
  })

  it("should allow exactly up to the limit", () => {
    const ip = "10.0.0.2"
    const prefix = "test-exact"

    for (let i = 0; i < 5; i++) {
      const result = rateLimit(createRequest(ip), 5, 60_000, prefix)
      expect(result).toBeNull()
    }
  })

  it("should block requests exceeding the limit", () => {
    const ip = "10.0.0.3"
    const prefix = "test-block"

    // Use up the limit
    for (let i = 0; i < 3; i++) {
      rateLimit(createRequest(ip), 3, 60_000, prefix)
    }

    // Next request should be blocked
    const result = rateLimit(createRequest(ip), 3, 60_000, prefix)
    expect(result).not.toBeNull()
    expect((result as any).status).toBe(429)
    expect((result as any).body.error).toContain("Demasiadas solicitudes")
  })

  it("should include Retry-After header when blocked", () => {
    const ip = "10.0.0.4"
    const prefix = "test-retry"

    for (let i = 0; i < 2; i++) {
      rateLimit(createRequest(ip), 2, 60_000, prefix)
    }

    const result = rateLimit(createRequest(ip), 2, 60_000, prefix)
    expect(result).not.toBeNull()
    expect((result as any).headers["Retry-After"]).toBeDefined()
  })

  it("should track different IPs separately", () => {
    const prefix = "test-ips"

    // Use up limit for IP 1
    for (let i = 0; i < 2; i++) {
      rateLimit(createRequest("10.0.0.5"), 2, 60_000, prefix)
    }

    // IP 2 should still be allowed
    const result = rateLimit(createRequest("10.0.0.6"), 2, 60_000, prefix)
    expect(result).toBeNull()

    // IP 1 should be blocked
    const blocked = rateLimit(createRequest("10.0.0.5"), 2, 60_000, prefix)
    expect(blocked).not.toBeNull()
    expect((blocked as any).status).toBe(429)
  })

  it("should track different prefixes separately", () => {
    const ip = "10.0.0.7"

    // Use up limit for prefix A
    for (let i = 0; i < 2; i++) {
      rateLimit(createRequest(ip), 2, 60_000, "prefix-a")
    }

    // Prefix B should still be allowed
    const result = rateLimit(createRequest(ip), 2, 60_000, "prefix-b")
    expect(result).toBeNull()
  })

  it("should use x-real-ip as fallback", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "10.0.0.8" },
    })
    const result = rateLimit(request, 5, 60_000, "test-realip")
    expect(result).toBeNull()
  })

  it("should handle request with no IP headers", () => {
    const request = new Request("http://localhost/api/test")
    const result = rateLimit(request, 5, 60_000, "test-noip")
    expect(result).toBeNull()
  })

  it("should reset after window expires", () => {
    vi.useFakeTimers()
    const ip = "10.0.0.9"
    const prefix = "test-reset"

    // Use up the limit
    for (let i = 0; i < 3; i++) {
      rateLimit(createRequest(ip), 3, 1000, prefix)
    }

    // Should be blocked
    const blocked = rateLimit(createRequest(ip), 3, 1000, prefix)
    expect(blocked).not.toBeNull()

    // Advance time past window
    vi.advanceTimersByTime(1500)

    // Should be allowed again
    const result = rateLimit(createRequest(ip), 3, 1000, prefix)
    expect(result).toBeNull()

    vi.useRealTimers()
  })
})
