import { NextResponse } from "next/server"
import { getMatch, getMatchStatistics } from "@/lib/genius-sports"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const includeStats = searchParams.get("stats") === "true"

  try {
    const match = await getMatch(params.id)

    if (includeStats) {
      try {
        const statistics = await getMatchStatistics(params.id)
        return NextResponse.json({ ...match, statistics })
      } catch {
        // Stats might not be available for all matches
        return NextResponse.json(match)
      }
    }

    return NextResponse.json(match)
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error obteniendo partido" },
      { status: 500 }
    )
  }
}
