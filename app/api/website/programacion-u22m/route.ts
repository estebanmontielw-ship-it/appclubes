import { NextResponse } from "next/server"
import { loadU22MSchedule } from "@/lib/programacion-lnb"
import { handleApiError } from "@/lib/api-errors"

export async function GET() {
  try {
    const payload = await loadU22MSchedule()
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (error: any) {
    return handleApiError(error, { context: "website/programacion-u22m" })
  }
}
