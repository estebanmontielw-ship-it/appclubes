import { NextResponse } from "next/server"
import { getLeadersFromMatches } from "@/lib/genius-sports"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const competitionId = searchParams.get("competitionId")

  if (!competitionId) {
    return NextResponse.json({ error: "competitionId es requerido" }, { status: 400 })
  }

  try {
    const data = await getLeadersFromMatches(competitionId)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: "Error obteniendo líderes" }, { status: 500 })
  }
}
