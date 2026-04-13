import { NextResponse } from "next/server"
import { loadLnbSchedule } from "@/lib/programacion-lnb"
import { handleApiError } from "@/lib/api-errors"

export async function GET() {
  try {
    const payload = await loadLnbSchedule()
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error: any) {
    if (error?.message?.includes("GENIUS_LNB_COMPETITION_ID")) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return handleApiError(error, { context: "website/programacion-lnb" })
  }
}
