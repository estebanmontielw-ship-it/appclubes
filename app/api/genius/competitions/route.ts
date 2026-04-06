import { NextResponse } from "next/server"
import { getCompetitions } from "@/lib/genius-sports"

export const revalidate = 3600 // ISR: revalidate every hour

export async function GET() {
  try {
    const data = await getCompetitions()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error obteniendo competencias" },
      { status: 500 }
    )
  }
}
