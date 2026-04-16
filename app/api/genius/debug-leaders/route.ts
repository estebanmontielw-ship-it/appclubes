import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

// Debug endpoint to find which stats endpoints return data for the leaders page
// GET /api/genius/debug-leaders
export async function GET() {
  try {
    const { id } = await resolveLnbCompetitionIdPublic()
    if (!id) return NextResponse.json({ error: "No competition ID" }, { status: 404 })

    const endpoints = [
      `/competitions/${id}/leaders`,
      `/competitions/${id}/personstatistics`,
      `/competitions/${id}/statistics`,
      `/competitions/${id}/persons?limit=5`,
    ]

    const results: Record<string, any> = { competitionId: id }

    await Promise.all(
      endpoints.map(async (path) => {
        try {
          const data = await geniusFetch(path, "short")
          const items: any[] =
            data?.response?.data ?? data?.data ?? (Array.isArray(data) ? data : [])
          results[path] = {
            ok: true,
            topLevelKeys: Object.keys(data ?? {}),
            itemCount: items.length,
            sample: items.slice(0, 2),
          }
        } catch (e: any) {
          results[path] = { ok: false, error: e.message }
        }
      })
    )

    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
