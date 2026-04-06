import { NextResponse } from "next/server"
import { getMatches } from "@/lib/genius-sports"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const competitionId = searchParams.get("competitionId") || undefined
  const status = searchParams.get("status") || undefined

  try {
    const params: Record<string, string> = {}
    if (status) params.status = status

    const data = await getMatches(competitionId, params)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error obteniendo partidos" },
      { status: 500 }
    )
  }
}
