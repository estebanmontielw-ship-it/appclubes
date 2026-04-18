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

const GENDER_SUFFIXES = [
  " KINGS", " QUEENS", " FEM", " FEMENINO", " MASCULINO",
  " DAMAS", " VARONES", " WOMEN", " MEN", " BASKET",
]

function stripGenderSuffix(name: string): string {
  const upper = name.toUpperCase()
  for (const suffix of GENDER_SUFFIXES) {
    if (upper.endsWith(suffix)) {
      return name.slice(0, name.length - suffix.length).trim()
    }
  }
  return name.trim()
}

function normalizeKey(name: string): string {
  return stripGenderSuffix(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
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

    // Merge by normalized base name, preferring entries that have a logo
    const byKey = new Map<string, { id: number; nombre: string; logoUrl: string | null; sigla: string | null; ciudad: string }>()

    for (const t of allTeams) {
      const rawName: string = t.competitorName ?? t.teamName ?? t.name ?? ""
      if (!rawName) continue

      const baseName = stripGenderSuffix(rawName)
      const key = normalizeKey(rawName)
      const logo = extractLogo(t)

      const existing = byKey.get(key)
      if (!existing) {
        byKey.set(key, {
          id: t.competitorId ?? t.teamId ?? t.id ?? 0,
          nombre: baseName,
          logoUrl: logo,
          sigla: t.competitorCode ?? t.teamCode ?? t.code ?? null,
          ciudad: t.city ?? "",
        })
      } else if (!existing.logoUrl && logo) {
        // upgrade to version that has a logo
        byKey.set(key, { ...existing, logoUrl: logo })
      }
    }

    const clubes = Array.from(byKey.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    )

    return NextResponse.json(
      { clubes },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
