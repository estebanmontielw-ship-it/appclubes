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

type Club = { id: number; nombre: string; logoUrl: string | null; sigla: string | null; ciudad: string }

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

    // Pass 1: dedupe by normalized name
    const byName = new Map<string, Club>()
    for (const t of allTeams) {
      const rawName: string = t.competitorName ?? t.teamName ?? t.name ?? ""
      if (!rawName) continue
      const key = normalizeKey(rawName)
      const logo = extractLogo(t)
      const existing = byName.get(key)
      if (!existing) {
        byName.set(key, {
          id: t.competitorId ?? t.teamId ?? t.id ?? 0,
          nombre: stripGenderSuffix(rawName),
          logoUrl: logo,
          sigla: t.competitorCode ?? t.teamCode ?? t.code ?? null,
          ciudad: t.city ?? "",
        })
      } else if (!existing.logoUrl && logo) {
        byName.set(key, { ...existing, logoUrl: logo })
      }
    }

    // Pass 2: dedupe by sigla — merge entries that share the same team code
    // e.g. "FELIX PEREZ CARDOZO" (sigla FPC) + "FPC" (sigla FPC) → one entry
    const bySigla = new Map<string, Club>()
    const noSigla: Club[] = []

    for (const club of byName.values()) {
      const code = club.sigla?.toUpperCase().trim()
      if (!code) { noSigla.push(club); continue }
      const existing = bySigla.get(code)
      if (!existing) {
        bySigla.set(code, club)
      } else {
        // Keep the entry with the longer/fuller name, prefer one with a logo
        const keepLonger = club.nombre.length > existing.nombre.length ? club : existing
        const logo = existing.logoUrl ?? club.logoUrl
        bySigla.set(code, { ...keepLonger, logoUrl: logo })
      }
    }

    const clubes = [...bySigla.values(), ...noSigla].sort((a, b) =>
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
