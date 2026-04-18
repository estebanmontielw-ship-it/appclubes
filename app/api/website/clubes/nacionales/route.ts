import { NextResponse } from "next/server"
import { getTeams } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic, resolveLnbfCompetitionIdPublic } from "@/lib/programacion-lnb"

function extractLogo(t: any): string | null {
  return (
    t?.images?.logo?.T1?.url ??
    t?.images?.logo?.S1?.url ??
    t?.images?.logo?.url ??
    t?.logoUrl ??
    null
  )
}

function normalize(s: string) {
  return s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export async function GET() {
  try {
    const [lnb, lnbf] = await Promise.all([
      resolveLnbCompetitionIdPublic(),
      resolveLnbfCompetitionIdPublic(),
    ])

    const fetches: Promise<any>[] = []
    if (lnb.id) fetches.push(getTeams(lnb.id))
    if (lnbf.id) fetches.push(getTeams(lnbf.id))

    const results = await Promise.allSettled(fetches)
    const allTeams: any[] = []
    for (const r of results) {
      if (r.status === "fulfilled") {
        const items: any[] = r.value?.response?.data || r.value?.data || (Array.isArray(r.value) ? r.value : [])
        allTeams.push(...items)
      }
    }

    const seen = new Set<string>()
    const clubes: { id: number; nombre: string; logoUrl: string | null; sigla: string | null; ciudad: string }[] = []

    for (const t of allTeams) {
      const name: string = t.competitorName ?? t.teamName ?? t.name ?? ""
      if (!name) continue
      const key = normalize(name)
      if (seen.has(key)) continue
      seen.add(key)
      clubes.push({
        id: t.competitorId ?? t.teamId ?? t.id ?? 0,
        nombre: name,
        logoUrl: extractLogo(t),
        sigla: t.competitorCode ?? t.teamCode ?? t.code ?? null,
        ciudad: t.city ?? t.venue ?? "",
      })
    }

    clubes.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))

    return NextResponse.json(
      { clubes },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
